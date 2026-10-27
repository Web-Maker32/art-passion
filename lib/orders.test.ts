import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

type CartFixture = {
  id: string;
  items: Array<{
    variantId: string;
    quantity: number;
    unitPrice: number;
    variant: {
      id: string;
      label: string;
      price: number;
      stock: number;
      product: {
        title: string;
        status: string;
        madeToOrder: boolean;
        leadTimeDays: number;
      };
    };
  }>;
};

type CreatedOrder = {
  idempotencyKey: string;
  orderNumber: string;
  subtotal: number;
  shipping: number;
  total: number;
  customerEmail: string | null;
  postalCode: string | null;
  items: {
    create: Array<{
      productTitle: string;
      variantLabel: string;
      unitPrice: number;
      quantity: number;
      leadTimeDays: number | null;
    }>;
  };
};

type TransactionMock = {
  $queryRaw: (strings: TemplateStringsArray) => Promise<Array<{ value?: number }>>;
  cart: { findUnique: () => Promise<CartFixture | null> };
  order: {
    findUnique: (args: {
      where: { idempotencyKey: string };
    }) => Promise<{ orderNumber: string } | null>;
    create: (args: { data: CreatedOrder }) => Promise<CreatedOrder>;
  };
  variant: {
    updateMany: (args: {
      where: { id: string; stock: { gte: number } };
      data: { stock: { decrement: number } };
    }) => Promise<{ count: number }>;
  };
  cartItem: { deleteMany: () => Promise<{ count: number }> };
};

const { database } = vi.hoisted(() => ({
  database: {
    orderRows: [] as CreatedOrder[],
    cart: null as CartFixture | null,
    variants: new Map<string, number>(),
    counter: 0,
    serial: Promise.resolve(),
  },
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    order: {
      findUnique: vi.fn(
        async ({ where }: { where: { idempotencyKey: string } }) =>
          database.orderRows.find(
            (row) => row.idempotencyKey === where.idempotencyKey,
          ) ?? null,
      ),
    },
    $transaction: vi.fn(
      async (work: (transaction: TransactionMock) => Promise<unknown>) => {
        const previous = database.serial;
        let release: () => void = () => undefined;
        database.serial = new Promise<void>((resolve) => {
          release = resolve;
        });
        await previous;

        const working = {
          orderRows: structuredClone(database.orderRows),
          cart: structuredClone(database.cart),
          variants: new Map(database.variants),
          counter: database.counter,
        };
        const transaction: TransactionMock = {
          $queryRaw: vi.fn(async (strings: TemplateStringsArray) => {
            if (strings.join(" ").includes('"OrderCounter"')) {
              working.counter += 1;
              return [{ value: working.counter }];
            }
            return [];
          }),
          cart: {
            findUnique: vi.fn(async () => working.cart),
          },
          order: {
            findUnique: vi.fn(
              async ({ where }: { where: { idempotencyKey: string } }) =>
                working.orderRows.find(
                  (row) => row.idempotencyKey === where.idempotencyKey,
                ) ?? null,
            ),
            create: vi.fn(async ({ data }: { data: CreatedOrder }) => {
              working.orderRows.push(data);
              return data;
            }),
          },
          variant: {
            updateMany: vi.fn(
              async ({
                where,
                data,
              }: {
                where: { id: string; stock: { gte: number } };
                data: { stock: { decrement: number } };
              }) => {
                const stock = working.variants.get(where.id) ?? 0;
                if (stock < where.stock.gte) return { count: 0 };
                working.variants.set(where.id, stock - data.stock.decrement);
                return { count: 1 };
              },
            ),
          },
          cartItem: {
            deleteMany: vi.fn(async () => {
              if (working.cart) working.cart.items = [];
              return { count: 1 };
            }),
          },
        };

        try {
          const result = await work(transaction);
          database.orderRows = working.orderRows;
          database.cart = working.cart;
          database.variants = working.variants;
          database.counter = working.counter;
          return result;
        } finally {
          release();
        }
      },
    ),
  },
}));

import {
  calculateOrderTotals,
  createOrderFromCart,
  getOrderYear,
} from "@/lib/orders";
import type { CheckoutFormData } from "@/lib/checkout-schema";

const checkoutData: CheckoutFormData = {
  fullName: "A Customer",
  mobileNumber: "+923001234567",
  email: "",
  deliveryAddress: "Street 1, House 2",
  city: "Lahore",
  province: "Punjab",
  postalCode: "",
  giftNote: "",
  orderNotes: "",
  termsAccepted: true,
  idempotencyKey: "cd984417-bdb2-4e04-8c5e-9ac9c949d6d1",
  honeypot: "",
};

function createCart({
  stock = 5,
  cartPrice = 1000,
  currentPrice = 1000,
  madeToOrder = false,
  status = "PUBLISHED",
}: {
  stock?: number;
  cartPrice?: number;
  currentPrice?: number;
  madeToOrder?: boolean;
  status?: string;
} = {}): CartFixture {
  return {
    id: "cart-1",
    items: [
      {
        variantId: "variant-1",
        quantity: 2,
        unitPrice: cartPrice,
        variant: {
          id: "variant-1",
          label: "Small",
          price: currentPrice,
          stock,
          product: {
            title: "Felt set",
            status,
            madeToOrder,
            leadTimeDays: 12,
          },
        },
      },
    ],
  };
}

describe("order totals", () => {
  it("uses the current unit price rather than the cart snapshot", () => {
    expect(
      calculateOrderTotals([{ unitPrice: 1500, quantity: 2 }]),
    ).toEqual({ subtotal: 3000, shipping: 350, total: 3350 });
  });
});

describe("order numbers", () => {
  it("uses the Pakistan calendar year", () => {
    expect(getOrderYear(new Date("2026-12-31T18:59:59.000Z"))).toBe(2026);
    expect(getOrderYear(new Date("2026-12-31T20:00:00.000Z"))).toBe(2027);
  });
});

describe("order creation", () => {
  beforeEach(() => {
    database.orderRows = [];
    database.cart = createCart();
    database.variants = new Map([["variant-1", 5]]);
    database.counter = 0;
    database.serial = Promise.resolve();
  });

  it("creates the order at current database prices and stores null optional fields", async () => {
    database.cart = createCart({ cartPrice: 1000, currentPrice: 1500 });

    const result = await createOrderFromCart(checkoutData, "cart-1");

    expect(result.status).toBe("created");
    const order = database.orderRows[0];
    expect(order).toBeDefined();
    expect(order?.orderNumber).toBe(`AP-${getOrderYear()}-0001`);
    expect(order?.subtotal).toBe(3000);
    expect(order?.shipping).toBe(350);
    expect(order?.total).toBe(3350);
    expect(order?.customerEmail).toBeNull();
    expect(order?.postalCode).toBeNull();
    expect(order?.items.create[0]?.unitPrice).toBe(1500);
  });

  it("creates no order and changes no stock when the atomic decrement fails", async () => {
    database.cart = createCart({ stock: 5 });
    database.variants = new Map([["variant-1", 1]]);

    const result = await createOrderFromCart(checkoutData, "cart-1");

    expect(result).toEqual({ status: "rejected", reason: "stock" });
    expect(database.orderRows).toHaveLength(0);
    expect(database.variants.get("variant-1")).toBe(1);
    expect(database.counter).toBe(0);
  });

  it("rejects a hidden product without creating an order", async () => {
    database.cart = createCart({ status: "HIDDEN" });

    const result = await createOrderFromCart(checkoutData, "cart-1");

    expect(result).toEqual({ status: "rejected", reason: "review" });
    expect(database.orderRows).toHaveLength(0);
    expect(database.variants.get("variant-1")).toBe(5);
  });

  it("rejects an empty cart", async () => {
    database.cart = { id: "cart-1", items: [] };

    const result = await createOrderFromCart(checkoutData, "cart-1");

    expect(result).toEqual({ status: "rejected", reason: "empty" });
    expect(database.orderRows).toHaveLength(0);
  });

  it("serializes parallel submissions with the same key into one order and a duplicate", async () => {
    const [first, second] = await Promise.all([
      createOrderFromCart(checkoutData, "cart-1"),
      createOrderFromCart(checkoutData, "cart-1"),
    ]);

    expect(database.orderRows).toHaveLength(1);
    expect([first.status, second.status].sort()).toEqual([
      "created",
      "duplicate",
    ]);
    const created = first.status === "created" ? first : second;
    const duplicate = first.status === "duplicate" ? first : second;
    expect(duplicate.status).toBe("duplicate");
    if (created.status === "created" && duplicate.status === "duplicate") {
      expect(duplicate.orderNumber).toBe(created.orderNumber);
    }
    expect(database.variants.get("variant-1")).toBe(3);
  });

  it("returns the first order for a repeated key after the cart was cleared", async () => {
    const first = await createOrderFromCart(checkoutData, "cart-1");
    expect(first.status).toBe("created");
    database.cart = null;

    const second = await createOrderFromCart(checkoutData, "cart-1");

    expect(second).toEqual({
      status: "duplicate",
      orderNumber: first.status === "created" ? first.orderNumber : "",
    });
    expect(database.orderRows).toHaveLength(1);
    expect(database.variants.get("variant-1")).toBe(3);
  });

  it("does not touch stock for made-to-order items and snapshots lead time", async () => {
    database.cart = createCart({ stock: 0, madeToOrder: true });
    database.variants = new Map([["variant-1", 0]]);

    const result = await createOrderFromCart(
      {
        ...checkoutData,
        idempotencyKey: "a3d908e8-6cb2-42f3-91f3-8014545d8c32",
      },
      "cart-1",
    );

    expect(result.status).toBe("created");
    expect(database.variants.get("variant-1")).toBe(0);
    expect(database.orderRows[0]?.items.create[0]?.leadTimeDays).toBe(12);
  });
});
