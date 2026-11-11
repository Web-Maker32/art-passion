import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { mocks } = vi.hoisted(() => ({
  mocks: {
    saveResult: { status: "saved" } as
      | { status: "saved" }
      | { status: "unverified" }
      | { status: "not_pending" },
    saveCalled: 0,
    lastInput: null as unknown,
    allowed: true,
    retryAfterSeconds: 0,
    saveThrows: false,
    loggerError: vi.fn(),
    loggerWarn: vi.fn(),
    loggerInfo: vi.fn(),
  },
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

vi.mock("@/lib/rate-limit", () => ({
  consumeRateLimit: vi.fn(async () => ({
    allowed: mocks.allowed,
    remaining: mocks.allowed ? 4 : 0,
    resetAtMs: 0,
    retryAfterSeconds: mocks.retryAfterSeconds,
    backend: "memory" as const,
  })),
}));

vi.mock("@/lib/payment-proof", () => ({
  savePaymentProof: vi.fn(async (input: unknown) => {
    mocks.saveCalled += 1;
    mocks.lastInput = input;
    if (mocks.saveThrows) throw new Error("database unavailable");
    return mocks.saveResult;
  }),
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    error: mocks.loggerError,
    warn: mocks.loggerWarn,
    info: mocks.loggerInfo,
  },
}));

import { paymentProofSavedMessage } from "@/lib/payment-proof-schema";
import { reportPaymentProof } from "@/actions/payment-proof";

const validInput = {
  orderNumber: "AP-2026-0001",
  token: "t".repeat(64),
  transactionId: "TXN123456",
  note: "Paid from my Easypaisa wallet.",
};

beforeEach(() => {
  mocks.saveResult = { status: "saved" };
  mocks.saveCalled = 0;
  mocks.lastInput = null;
  mocks.allowed = true;
  mocks.retryAfterSeconds = 0;
  mocks.saveThrows = false;
  mocks.loggerError.mockClear();
  mocks.loggerWarn.mockClear();
  mocks.loggerInfo.mockClear();
});

describe("reportPaymentProof validation", () => {
  it("rejects a transaction ID that is too short", async () => {
    const result = await reportPaymentProof({
      ...validInput,
      transactionId: "ABC12",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.fieldErrors?.transactionId).toBeTruthy();
    }
    expect(mocks.saveCalled).toBe(0);
  });

  it("rejects a transaction ID with invalid characters", async () => {
    const result = await reportPaymentProof({
      ...validInput,
      transactionId: "TXN-123456",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.fieldErrors?.transactionId).toBeTruthy();
    }
    expect(mocks.saveCalled).toBe(0);
  });

  it("rejects a note longer than 200 characters", async () => {
    const result = await reportPaymentProof({
      ...validInput,
      note: "n".repeat(201),
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.fieldErrors?.note).toBeTruthy();
    }
    expect(mocks.saveCalled).toBe(0);
  });

  it("saves a valid report and returns the received message", async () => {
    const result = await reportPaymentProof(validInput);

    expect(result).toEqual({ success: true, message: paymentProofSavedMessage });
    expect(result.success && result.message).toBe(
      "We received your payment details. We will confirm your order soon.",
    );
    expect(mocks.saveCalled).toBe(1);
    expect(mocks.lastInput).toMatchObject({
      orderNumber: "AP-2026-0001",
      transactionId: "TXN123456",
    });
  });

  it("rejects a wrong token", async () => {
    mocks.saveResult = { status: "unverified" };

    const result = await reportPaymentProof(validInput);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.message).toMatch(/could not verify/i);
    }
  });

  it("rejects an order that is no longer PENDING", async () => {
    mocks.saveResult = { status: "not_pending" };

    const result = await reportPaymentProof(validInput);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.message).toMatch(/no longer waiting/i);
    }
  });
});

describe("reportPaymentProof rate limiting", () => {
  it("blocks the request before validating or saving", async () => {
    mocks.allowed = false;
    mocks.retryAfterSeconds = 90;

    const result = await reportPaymentProof(validInput);

    expect(result).toEqual({
      success: false,
      message: "Too many attempts. Wait a few minutes and try again.",
      retryAfterSeconds: 90,
    });
    expect(mocks.saveCalled).toBe(0);
  });
});

describe("reportPaymentProof logging", () => {
  it("never logs the transaction ID", async () => {
    const consoleSpies = [
      vi.spyOn(console, "log").mockImplementation(() => {}),
      vi.spyOn(console, "info").mockImplementation(() => {}),
      vi.spyOn(console, "warn").mockImplementation(() => {}),
      vi.spyOn(console, "error").mockImplementation(() => {}),
    ];

    await reportPaymentProof(validInput);

    const logged = JSON.stringify([
      ...consoleSpies.flatMap((spy) => spy.mock.calls),
      mocks.loggerError.mock.calls,
      mocks.loggerWarn.mock.calls,
      mocks.loggerInfo.mock.calls,
    ]);
    expect(logged).not.toContain("TXN123456");

    for (const spy of consoleSpies) spy.mockRestore();
  });

  it("logs a fixed event and hides details when saving throws", async () => {
    mocks.saveThrows = true;

    const result = await reportPaymentProof(validInput);

    expect(result).toEqual({
      success: false,
      message: "We could not save your payment details. Please try again.",
    });
    expect(mocks.loggerError).toHaveBeenCalledWith("payment_proof_failed");
    const logged = JSON.stringify(mocks.loggerError.mock.calls);
    expect(logged).not.toContain("TXN123456");
  });
});
