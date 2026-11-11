import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { mocks } = vi.hoisted(() => ({
  mocks: {
    authorized: false,
    changeCalls: [] as Array<Record<string, unknown>>,
    result: { status: "changed", fromStatus: "PAID", toStatus: "PROCESSING" } as Record<
      string,
      unknown
    >,
  },
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

vi.mock("@/lib/admin-auth", () => ({
  assertAdmin: vi.fn(async () =>
    mocks.authorized
      ? { authorized: true, userId: "admin-1" }
      : { authorized: false },
  ),
}));

vi.mock("@/lib/admin-orders", () => ({
  changeOrderStatus: vi.fn(async (input: Record<string, unknown>) => {
    mocks.changeCalls.push(input);
    return mocks.result;
  }),
}));

import {
  cancelOrder,
  markOrderDelivered,
  markOrderPaid,
  markOrderProcessing,
  shipOrder,
} from "@/actions/admin-orders";

const unauthorized = {
  success: false,
  message: "Your session expired. Please sign in again.",
};

const orderNumber = "AP-2026-0001";

beforeEach(() => {
  mocks.authorized = false;
  mocks.changeCalls = [];
  mocks.result = { status: "changed", fromStatus: "PAID", toStatus: "PROCESSING" };
});

describe("admin order actions reject unauthenticated calls", () => {
  it("markOrderPaid is blocked", async () => {
    const result = await markOrderPaid({ orderNumber, paymentReference: "TXN123456" });
    expect(result).toEqual(unauthorized);
    expect(mocks.changeCalls).toHaveLength(0);
  });

  it("markOrderProcessing is blocked", async () => {
    const result = await markOrderProcessing({ orderNumber });
    expect(result).toEqual(unauthorized);
    expect(mocks.changeCalls).toHaveLength(0);
  });

  it("shipOrder is blocked", async () => {
    const result = await shipOrder({ orderNumber, courierName: "TCS", trackingNumber: "TRK1" });
    expect(result).toEqual(unauthorized);
    expect(mocks.changeCalls).toHaveLength(0);
  });

  it("markOrderDelivered is blocked", async () => {
    const result = await markOrderDelivered({ orderNumber });
    expect(result).toEqual(unauthorized);
    expect(mocks.changeCalls).toHaveLength(0);
  });

  it("cancelOrder is blocked", async () => {
    const result = await cancelOrder({ orderNumber, note: "Customer changed their mind" });
    expect(result).toEqual(unauthorized);
    expect(mocks.changeCalls).toHaveLength(0);
  });
});

describe("admin order actions allow an authenticated admin", () => {
  beforeEach(() => {
    mocks.authorized = true;
  });

  it("moves an order to processing", async () => {
    const result = await markOrderProcessing({ orderNumber });

    expect(result).toEqual({ success: true, message: "Order moved to processing." });
    expect(mocks.changeCalls[0]).toEqual({ orderNumber, toStatus: "PROCESSING" });
  });

  it("cancels with the note and reports the stock restore", async () => {
    mocks.result = { status: "changed", fromStatus: "PAID", toStatus: "CANCELLED" };

    const result = await cancelOrder({ orderNumber, note: "refund sent" });

    expect(result).toEqual({
      success: true,
      message: "Order cancelled and stock restored.",
    });
    expect(mocks.changeCalls[0]).toEqual({
      orderNumber,
      toStatus: "CANCELLED",
      note: "refund sent",
    });
  });

  it("returns the server message for a rejected transition", async () => {
    mocks.result = { status: "invalid_transition", fromStatus: "PAID", toStatus: "SHIPPED" };

    const result = await shipOrder({ orderNumber });

    expect(result).toEqual({
      success: false,
      message: "That status change is not allowed from the order's current state.",
    });
  });

  it("rejects an unknown order number before touching the order", async () => {
    const result = await markOrderPaid({ orderNumber: "not-an-order" });

    expect(result.success).toBe(false);
    expect(mocks.changeCalls).toHaveLength(0);
  });
});
