import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { sendMock, constructorMock, findUniqueMock } = vi.hoisted(() => ({
  sendMock: vi.fn(),
  constructorMock: vi.fn(),
  findUniqueMock: vi.fn(),
}));

vi.mock("resend", () => ({
  Resend: class {
    emails = { send: sendMock };
    constructor(apiKey: string) {
      constructorMock(apiKey);
    }
  },
}));

vi.mock("@/lib/db", () => ({
  prisma: { order: { findUnique: findUniqueMock } },
}));

import { env } from "@/lib/env";
import { sendOwnerNewOrderEmail } from "@/lib/email/send-owner-new-order";

const mutableEnv = env as unknown as Record<string, string | undefined>;

const orderRow = {
  orderNumber: "AP-2026-0001",
  createdAt: new Date("2026-11-06T14:42:00Z"),
  status: "PENDING",
  paymentMethod: "WALLET_TRANSFER",
  subtotal: 3900,
  shipping: 350,
  total: 4250,
  customerName: "Ayesha Khan",
  customerPhone: "03001234567",
  customerEmail: "ayesha@example.com",
  addressLine1: "House 12, Street 4",
  addressLine2: null,
  city: "Islamabad",
  province: "Islamabad Capital Territory",
  postalCode: "44000",
  country: "Pakistan",
  giftNote: null,
  orderNotes: null,
  items: [
    {
      productTitle: "Sample: Woodland Friends Felt Play Set",
      variantLabel: "Small set",
      unitPrice: 3900,
      quantity: 1,
    },
  ],
};

function configureEnv(overrides: Record<string, string | undefined>): void {
  mutableEnv.RESEND_API_KEY = overrides.RESEND_API_KEY;
  mutableEnv.ORDER_NOTIFY_EMAIL = overrides.ORDER_NOTIFY_EMAIL;
  mutableEnv.EMAIL_FROM = overrides.EMAIL_FROM;
}

describe("sendOwnerNewOrderEmail", () => {
  beforeEach(() => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    sendMock.mockReset();
    constructorMock.mockReset();
    findUniqueMock.mockReset();
    configureEnv({
      RESEND_API_KEY: "re_test_key",
      ORDER_NOTIFY_EMAIL: "owner@example.com",
      EMAIL_FROM: "Art Passion <orders@example.com>",
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("sends one email to the owner when everything is configured", async () => {
    findUniqueMock.mockResolvedValue(orderRow);
    sendMock.mockResolvedValue({ data: { id: "email_1" }, error: null });

    const result = await sendOwnerNewOrderEmail("AP-2026-0001");

    expect(result).toEqual({ status: "sent" });
    expect(constructorMock).toHaveBeenCalledWith("re_test_key");
    expect(sendMock).toHaveBeenCalledTimes(1);
    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "owner@example.com",
        from: "Art Passion <orders@example.com>",
        subject: "New order AP-2026-0001, Rs 4,250",
      }),
    );

    const payload = sendMock.mock.calls[0][0] as { html: string; text: string };
    expect(payload.html).toContain("http://localhost:3000/admin/orders/AP-2026-0001");
    expect(payload.text).toContain("Ayesha Khan");
    expect(payload.html).not.toMatch(/accessToken/i);
    expect(payload.text).not.toMatch(/[0-9a-f]{32,}/i);
  });

  it("skips sending when the email settings are missing, without throwing", async () => {
    configureEnv({});

    const result = await sendOwnerNewOrderEmail("AP-2026-0001");

    expect(result).toEqual({ status: "skipped" });
    expect(sendMock).not.toHaveBeenCalled();
    expect(constructorMock).not.toHaveBeenCalled();
    expect(findUniqueMock).not.toHaveBeenCalled();
  });

  it("skips sending when only one setting is missing", async () => {
    configureEnv({ RESEND_API_KEY: "re_test_key", ORDER_NOTIFY_EMAIL: "", EMAIL_FROM: "a@b.test" });

    const result = await sendOwnerNewOrderEmail("AP-2026-0001");

    expect(result).toEqual({ status: "skipped" });
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("reports a failure instead of throwing when Resend returns an error", async () => {
    findUniqueMock.mockResolvedValue(orderRow);
    sendMock.mockResolvedValue({
      data: null,
      error: { name: "validation_error", message: "The from address is not verified." },
    });

    await expect(sendOwnerNewOrderEmail("AP-2026-0001")).resolves.toEqual({
      status: "failed",
    });
  });

  it("reports a failure instead of throwing when Resend rejects the call", async () => {
    findUniqueMock.mockResolvedValue(orderRow);
    sendMock.mockRejectedValue(new Error("network down"));

    await expect(sendOwnerNewOrderEmail("AP-2026-0001")).resolves.toEqual({
      status: "failed",
    });
  });

  it("reports a failure when the order cannot be read", async () => {
    findUniqueMock.mockResolvedValue(null);

    await expect(sendOwnerNewOrderEmail("AP-2026-9999")).resolves.toEqual({
      status: "failed",
    });
    expect(sendMock).not.toHaveBeenCalled();
  });
});
