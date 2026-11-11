import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { state } = vi.hoisted(() => ({
  state: {
    storedOrder: null as { status: string; accessTokenHash: string | null } | null,
    updateCount: 1,
    updates: [] as Array<Record<string, unknown>>,
    tokenValid: true,
    cookieValue: null as string | null,
  },
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    order: {
      findUnique: vi.fn(async () => state.storedOrder),
      updateMany: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
        state.updates.push(data);
        return { count: state.updateCount };
      }),
    },
  },
}));

vi.mock("@/lib/order-access", () => ({
  getOrderAccessCookieValue: vi.fn(async () => state.cookieValue),
  selectOrderAccessToken: vi.fn(() =>
    state.tokenValid ? "token-from-cookie" : null,
  ),
}));

import { paymentProofSchema } from "@/lib/payment-proof-schema";
import { savePaymentProof } from "@/lib/payment-proof";

const validInput = {
  orderNumber: "AP-2026-0001",
  token: "t".repeat(64),
  transactionId: "TXN123456",
  note: "Paid from my Easypaisa wallet.",
};

beforeEach(() => {
  state.storedOrder = { status: "PENDING", accessTokenHash: "stored-hash" };
  state.updateCount = 1;
  state.updates = [];
  state.tokenValid = true;
  state.cookieValue = null;
});

describe("paymentProofSchema", () => {
  it("accepts a 6 character transaction ID", () => {
    const parsed = paymentProofSchema.safeParse({
      ...validInput,
      transactionId: "ABC123",
    });
    expect(parsed.success).toBe(true);
  });

  it("accepts a 40 character transaction ID", () => {
    const parsed = paymentProofSchema.safeParse({
      ...validInput,
      transactionId: "A1".repeat(20),
    });
    expect(parsed.success).toBe(true);
  });

  it("trims the transaction ID and note", () => {
    const parsed = paymentProofSchema.safeParse({
      orderNumber: "  AP-2026-0001  ",
      token: "  ".concat("t".repeat(64)),
      transactionId: "  123456  ",
      note: "  paid  ",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.transactionId).toBe("123456");
      expect(parsed.data.note).toBe("paid");
    }
  });

  it("rejects a transaction ID shorter than 6 characters", () => {
    const parsed = paymentProofSchema.safeParse({
      ...validInput,
      transactionId: "ABC12",
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues[0]?.path).toEqual(["transactionId"]);
    }
  });

  it("rejects a transaction ID longer than 40 characters", () => {
    const parsed = paymentProofSchema.safeParse({
      ...validInput,
      transactionId: "A".repeat(41),
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects a transaction ID with separator characters", () => {
    for (const value of ["TXN-123456", "1234 5678", "TXN_123456", "TXN#12345"]) {
      expect(paymentProofSchema.safeParse({ ...validInput, transactionId: value }).success).toBe(
        false,
      );
    }
  });

  it("requires a transaction ID", () => {
    const parsed = paymentProofSchema.safeParse({
      ...validInput,
      transactionId: "",
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects a note longer than 200 characters", () => {
    const parsed = paymentProofSchema.safeParse({
      ...validInput,
      note: "n".repeat(201),
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues[0]?.path).toEqual(["note"]);
    }
  });

  it("rejects unknown fields", () => {
    const parsed = paymentProofSchema.safeParse({
      ...validInput,
      isAdmin: true,
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects a malformed order number", () => {
    for (const orderNumber of ["", "AP-26-1", "XX-2026-0001", "AP-2026-1"]) {
      expect(
        paymentProofSchema.safeParse({ ...validInput, orderNumber }).success,
      ).toBe(false);
    }
  });

  it("caps the token length", () => {
    const parsed = paymentProofSchema.safeParse({
      ...validInput,
      token: "t".repeat(201),
    });
    expect(parsed.success).toBe(false);
  });
});

describe("savePaymentProof", () => {
  it("stores the reference, note and report time while PENDING", async () => {
    const result = await savePaymentProof(validInput);

    expect(result).toEqual({ status: "saved" });
    expect(state.updates).toHaveLength(1);
    expect(state.updates[0]).toMatchObject({
      paymentReference: "TXN123456",
      paymentNote: "Paid from my Easypaisa wallet.",
    });
    expect(state.updates[0]?.paymentReportedAt).toBeInstanceOf(Date);
  });

  it("stores a null note when the note is blank", async () => {
    await savePaymentProof({ ...validInput, note: "   " });

    expect(state.updates[0]?.paymentNote).toBeNull();
  });

  it("rejects an unknown order", async () => {
    state.storedOrder = null;

    const result = await savePaymentProof(validInput);

    expect(result).toEqual({ status: "unverified" });
    expect(state.updates).toHaveLength(0);
  });

  it("rejects a wrong or missing token without touching the order", async () => {
    state.tokenValid = false;

    const result = await savePaymentProof(validInput);

    expect(result).toEqual({ status: "unverified" });
    expect(state.updates).toHaveLength(0);
  });

  it("rejects an order that is no longer PENDING", async () => {
    state.storedOrder = { status: "PAID", accessTokenHash: "stored-hash" };

    const result = await savePaymentProof(validInput);

    expect(result).toEqual({ status: "not_pending" });
    expect(state.updates).toHaveLength(0);
  });

  it("reports not_pending when the compare-and-set misses", async () => {
    state.updateCount = 0;

    const result = await savePaymentProof(validInput);

    expect(result).toEqual({ status: "not_pending" });
  });
});
