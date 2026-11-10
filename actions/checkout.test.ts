import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { notifyMock, createOrderMock, findOrderMock, clearCartMock, limitMock } = vi.hoisted(() => ({
  notifyMock: vi.fn(),
  createOrderMock: vi.fn(),
  findOrderMock: vi.fn(),
  clearCartMock: vi.fn(),
  limitMock: vi.fn(async () => ({ allowed: true, remaining: 4, resetAtMs: 0, retryAfterSeconds: 0, backend: "memory" as const })),
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/cart", () => ({
  clearCartCookieAfterCheckout: clearCartMock,
  getCurrentCartIdForCheckout: vi.fn(async () => "cart_1"),
}));
vi.mock("@/lib/order-access", () => ({ setOrderAccessCookie: vi.fn(async () => {}) }));
vi.mock("@/lib/rate-limit", () => ({ consumeRateLimit: limitMock }));
vi.mock("@/lib/orders", () => ({
  createOrderFromCart: createOrderMock,
  findOrderByIdempotencyKey: findOrderMock,
}));
vi.mock("@/lib/email/notify-owner", () => ({ notifyOwnerOfNewOrder: notifyMock }));

import { processCheckout } from "@/actions/checkout";

const validInput = {
  fullName: "Ayesha Khan",
  mobileNumber: "03001234567",
  email: "ayesha@example.com",
  deliveryAddress: "House 12, Street 4",
  city: "Islamabad",
  province: "Islamabad Capital Territory",
  postalCode: "44000",
  giftNote: "",
  orderNotes: "",
  termsAccepted: true,
  idempotencyKey: "3f2c1d9e-6a4b-4c8d-9e0f-1a2b3c4d5e6f",
  honeypot: "",
};

describe("processCheckout owner notification", () => {
  beforeEach(() => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    notifyMock.mockReset();
    limitMock.mockClear();
    limitMock.mockResolvedValue({ allowed: true, remaining: 4, resetAtMs: 0, retryAfterSeconds: 0, backend: "memory" });
    createOrderMock.mockReset();
    findOrderMock.mockReset();
    clearCartMock.mockReset();
    findOrderMock.mockResolvedValue(null);
  });

  it("notifies the owner exactly once after an order is created", async () => {
    createOrderMock.mockResolvedValue({
      status: "created",
      orderNumber: "AP-2026-0001",
      accessToken: "plain-token",
    });

    const result = await processCheckout(validInput);

    expect(result.success).toBe(true);
    expect(notifyMock).toHaveBeenCalledTimes(1);
    expect(notifyMock).toHaveBeenCalledWith("AP-2026-0001");
  });

  it("does not notify for a duplicate submission", async () => {
    createOrderMock.mockResolvedValue({ status: "duplicate", orderNumber: "AP-2026-0001" });

    const result = await processCheckout(validInput);

    expect(result.success).toBe(false);
    expect(notifyMock).not.toHaveBeenCalled();
  });

  it("does not notify for a rejected checkout", async () => {
    createOrderMock.mockResolvedValue({ status: "rejected", reason: "stock" });

    const result = await processCheckout(validInput);

    expect(result.success).toBe(false);
    expect(notifyMock).not.toHaveBeenCalled();
  });

  it("does not notify when the form is invalid", async () => {
    const result = await processCheckout({ ...validInput, fullName: "" });

    expect(result.success).toBe(false);
    expect(createOrderMock).not.toHaveBeenCalled();
    expect(notifyMock).not.toHaveBeenCalled();
  });

  it("still succeeds when scheduling the notification throws", async () => {
    createOrderMock.mockResolvedValue({
      status: "created",
      orderNumber: "AP-2026-0001",
      accessToken: "plain-token",
    });
    notifyMock.mockImplementation(() => {
      throw new Error("email scheduling exploded");
    });

    const result = await processCheckout(validInput);

    expect(result.success).toBe(true);
    expect(clearCartMock).toHaveBeenCalledTimes(1);
  });

  it("rejects a tampered client price and never reaches order creation", async () => {
    const result = await processCheckout({ ...validInput, total: 1, lineTotal: 1 });

    expect(result.success).toBe(false);
    expect(createOrderMock).not.toHaveBeenCalled();
  });

  it("rejects oversized text and invalid quantities before order creation", async () => {
    const longName = await processCheckout({ ...validInput, fullName: "A".repeat(101) });
    expect(longName.success).toBe(false);

    const longNote = await processCheckout({ ...validInput, orderNotes: "x".repeat(501) });
    expect(longNote.success).toBe(false);

    const badPhone = await processCheckout({ ...validInput, mobileNumber: "not-a-phone" });
    expect(badPhone.success).toBe(false);
    expect(createOrderMock).not.toHaveBeenCalled();
  });

  it("blocks checkout with a friendly message and Retry-After when rate limited", async () => {
    limitMock.mockResolvedValue({ allowed: false, remaining: 0, resetAtMs: 0, retryAfterSeconds: 600, backend: "memory" });

    const result = await processCheckout(validInput);

    expect(result).toMatchObject({
      success: false,
      message: "Please wait a moment before trying again.",
      retryAfterSeconds: 600,
    });
    expect(createOrderMock).not.toHaveBeenCalled();
  });
});
