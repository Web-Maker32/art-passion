import { describe, expect, it } from "vitest";
import { checkoutSchema } from "@/lib/checkout-schema";

const validInput = {
  fullName: "A Customer",
  mobileNumber: "03001234567",
  deliveryAddress: "Street 1, House 2",
  city: "Lahore",
  province: "Punjab",
  giftNote: "",
  orderNotes: "",
  termsAccepted: true,
  idempotencyKey: "cd984417-bdb2-4e04-8c5e-9ac9c949d6d1",
  honeypot: "",
};

describe("checkoutSchema", () => {
  it("normalizes the phone and defaults omitted optional fields to empty strings", () => {
    const result = checkoutSchema.safeParse({
      ...validInput,
      email: undefined,
      postalCode: undefined,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.mobileNumber).toBe("+923001234567");
      expect(result.data.email).toBe("");
      expect(result.data.postalCode).toBe("");
    }
  });

  it("rejects client-supplied prices and totals", () => {
    const result = checkoutSchema.safeParse({ ...validInput, total: 1 });

    expect(result.success).toBe(false);
  });

  it.each([
    "0300-1234567",
    "03001234567",
    "+92 300 1234567",
    "0092 300 1234567",
  ])("stores %s in the single canonical format", (mobileNumber) => {
    const result = checkoutSchema.safeParse({ ...validInput, mobileNumber });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.mobileNumber).toBe("+923001234567");
    }
  });

  it("shows a clear field error for an invalid phone number", () => {
    const result = checkoutSchema.safeParse({
      ...validInput,
      mobileNumber: "12345",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "Enter a valid Pakistani mobile number.",
      );
    }
  });

  it("requires the terms checkbox", () => {
    const result = checkoutSchema.safeParse({
      ...validInput,
      termsAccepted: false,
    });

    expect(result.success).toBe(false);
  });
});
