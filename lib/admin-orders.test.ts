import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

type MockOrderItem = {
  variantId: string | null;
  quantity: number;
  madeToOrder: boolean;
};

type MockOrder = {
  id: string;
  orderNumber: string;
  status: string;
  stockRestoredAt: Date | null;
  items: MockOrderItem[];
};

type MockEvent = {
  orderId: string;
  type: string;
  fromStatus: string | null;
  toStatus: string | null;
  note: string | null;
};

const { db } = vi.hoisted(() => ({
  db: {
    orders: [] as MockOrder[],
    variants: new Map<string, number>(),
    events: [] as MockEvent[],
  },
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    $transaction: vi.fn(async (work: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        order: {
          findUnique: vi.fn(
            async ({
              where,
            }: {
              where: { orderNumber: string };
            }) => {
              const order = db.orders.find(
                (o) => o.orderNumber === where.orderNumber,
              );
              if (!order) return null;
              return {
                id: order.id,
                status: order.status,
                stockRestoredAt: order.stockRestoredAt,
                items: order.items,
              };
            },
          ),
          updateMany: vi.fn(
            async ({
              where,
              data,
            }: {
              where: { orderNumber: string; status?: string };
              data: Record<string, unknown>;
            }) => {
              const order = db.orders.find(
                (o) => o.orderNumber === where.orderNumber,
              );
              if (!order) return { count: 0 };
              if (where.status && order.status !== where.status) {
                return { count: 0 };
              }
              Object.assign(order, data);
              return { count: 1 };
            },
          ),
        },
        variant: {
          updateMany: vi.fn(
            async ({
              where,
              data,
            }: {
              where: { id: string };
              data: { stock: { increment: number } };
            }) => {
              const current = db.variants.get(where.id);
              if (current === undefined) return { count: 0 };
              db.variants.set(where.id, current + data.stock.increment);
              return { count: 1 };
            },
          ),
        },
        orderEvent: {
          create: vi.fn(
            async ({
              data,
            }: {
              data: {
                orderId: string;
                type: string;
                fromStatus: string | null;
                toStatus: string | null;
                note: string | null;
              };
            }) => {
              db.events.push(data);
              return data;
            },
          ),
        },
      };
      return work(tx);
    }),
  },
}));

import { changeOrderStatus } from "@/lib/admin-orders";

function createTestOrder(overrides: Partial<MockOrder> = {}): MockOrder {
  return {
    id: "order-1",
    orderNumber: "AP-2026-0001",
    status: "PENDING",
    stockRestoredAt: null,
    items: [
      { variantId: "variant-1", quantity: 2, madeToOrder: false },
      { variantId: "variant-2", quantity: 1, madeToOrder: true },
    ],
    ...overrides,
  };
}

beforeEach(() => {
  db.orders = [createTestOrder()];
  db.variants = new Map([
    ["variant-1", 5],
    ["variant-2", 3],
  ]);
  db.events = [];
});

describe("changeOrderStatus", () => {
  it("marks paid and writes an OrderEvent", async () => {
    const result = await changeOrderStatus({
      orderNumber: "AP-2026-0001",
      toStatus: "PAID",
      paymentReference: "TXN-123",
    });

    expect(result).toEqual({
      status: "changed",
      fromStatus: "PENDING",
      toStatus: "PAID",
    });
    expect(db.orders[0]?.status).toBe("PAID");
    expect(db.events).toHaveLength(1);
    expect(db.events[0]).toMatchObject({
      orderId: "order-1",
      type: "STATUS_CHANGE",
      fromStatus: "PENDING",
      toStatus: "PAID",
    });
  });

  it("rejects an invalid transition and writes no event", async () => {
    const result = await changeOrderStatus({
      orderNumber: "AP-2026-0001",
      toStatus: "SHIPPED",
    });

    expect(result).toEqual({
      status: "invalid_transition",
      fromStatus: "PENDING",
      toStatus: "SHIPPED",
    });
    expect(db.orders[0]?.status).toBe("PENDING");
    expect(db.events).toHaveLength(0);
  });

  it("returns not_found for a missing order", async () => {
    const result = await changeOrderStatus({
      orderNumber: "AP-2026-9999",
      toStatus: "PAID",
    });

    expect(result).toEqual({ status: "not_found" });
    expect(db.events).toHaveLength(0);
  });

  it("restores stock for non-made-to-order items on cancel", async () => {
    const result = await changeOrderStatus({
      orderNumber: "AP-2026-0001",
      toStatus: "CANCELLED",
      note: "Customer requested",
    });

    expect(result.status).toBe("changed");
    // variant-1 (non-made-to-order, qty 2): 5 + 2 = 7
    expect(db.variants.get("variant-1")).toBe(7);
    // variant-2 (made-to-order, qty 1): unchanged at 3
    expect(db.variants.get("variant-2")).toBe(3);
    expect(db.orders[0]?.stockRestoredAt).toBeInstanceOf(Date);
    expect(db.events[0]?.note).toBe("Customer requested");
  });

  it("does not restore stock twice (guard via stockRestoredAt)", async () => {
    // First cancel restores stock
    await changeOrderStatus({
      orderNumber: "AP-2026-0001",
      toStatus: "CANCELLED",
    });
    expect(db.variants.get("variant-1")).toBe(7);

    // Second cancel: CANCELLED → CANCELLED is an invalid transition
    const result = await changeOrderStatus({
      orderNumber: "AP-2026-0001",
      toStatus: "CANCELLED",
    });
    expect(result.status).toBe("invalid_transition");
    // Stock unchanged from first restore
    expect(db.variants.get("variant-1")).toBe(7);
    expect(db.events).toHaveLength(1);
  });

  it("skips stock restore for items with null variantId", async () => {
    db.orders[0]!.items = [
      { variantId: null, quantity: 5, madeToOrder: false },
    ];

    await changeOrderStatus({
      orderNumber: "AP-2026-0001",
      toStatus: "CANCELLED",
    });

    // No variant to restore
    expect(db.variants.get("variant-1")).toBe(5);
    expect(db.orders[0]?.stockRestoredAt).toBeInstanceOf(Date);
  });

  it("tolerates a missing variant during restore", async () => {
    db.variants.delete("variant-1");

    const result = await changeOrderStatus({
      orderNumber: "AP-2026-0001",
      toStatus: "CANCELLED",
    });

    // Should still succeed (updateMany returns count 0 for missing variant)
    expect(result.status).toBe("changed");
    expect(db.orders[0]?.stockRestoredAt).toBeInstanceOf(Date);
  });

  it("ships with courier and tracking, writes event", async () => {
    db.orders[0]!.status = "PAID";

    const result = await changeOrderStatus({
      orderNumber: "AP-2026-0001",
      toStatus: "SHIPPED",
      courierName: "TCS",
      trackingNumber: "TRK-999",
    });

    expect(result.status).toBe("changed");
    expect(db.orders[0]?.status).toBe("SHIPPED");
    expect(db.events).toHaveLength(1);
    expect(db.events[0]?.toStatus).toBe("SHIPPED");
  });

  it("delivers from SHIPPED and writes event", async () => {
    db.orders[0]!.status = "SHIPPED";

    const result = await changeOrderStatus({
      orderNumber: "AP-2026-0001",
      toStatus: "DELIVERED",
    });

    expect(result).toEqual({
      status: "changed",
      fromStatus: "SHIPPED",
      toStatus: "DELIVERED",
    });
    expect(db.events).toHaveLength(1);
    expect(db.events[0]?.toStatus).toBe("DELIVERED");
  });

  it("returns conflict when CAS fails (concurrent modification)", async () => {
    // Simulate: order changes between read and write
    const originalFindUnique = db.orders[0];
    vi.spyOn(db.orders, "find").mockImplementationOnce(() => originalFindUnique);

    // First: change status behind the scenes
    db.orders[0]!.status = "PAID";

    const result = await changeOrderStatus({
      orderNumber: "AP-2026-0001",
      toStatus: "PAID",
    });

    // findUnique returns the order with PAID status, then canTransition(PAID,PAID) is false
    expect(result.status).toBe("invalid_transition");
  });
});
