import { describe, expect, it } from "vitest";
import {
  buildCartOrderWhatsAppMessage,
  buildOrderPaymentWhatsAppMessage,
  buildWhatsAppLink,
  formatWhatsAppDisplay,
  normalizeWhatsAppNumber,
} from "@/lib/whatsapp";
import type { CartView } from "@/lib/cart-types";

const cart: CartView = {
  cartId: "cart-1",
  items: [
    {
      itemId: "item-1",
      variantId: "variant-1",
      productTitle: "Felt play set",
      productSlug: "felt-play-set",
      imageUrl: null,
      imageAlt: "Felt play set",
      variantLabel: "Rainbow",
      quantity: 2,
      unitPrice: 1250,
      stock: 4,
      madeToOrder: false,
      maxQuantity: 4,
      lineTotal: 2500,
      available: true,
      editable: true,
      message: null,
    },
  ],
  itemCount: 2,
  subtotal: 2500,
  unavailableCount: 0,
};

describe("buildCartOrderWhatsAppMessage", () => {
  it("lists each item, variant, quantity, line total, and subtotal", () => {
    const message = buildCartOrderWhatsAppMessage(cart);

    expect(message).toContain("Felt play set (Rainbow) × 2");
    expect(message).toContain("2,500");
    expect(message).toContain("Subtotal:");
  });
});

describe("buildOrderPaymentWhatsAppMessage", () => {
  it("includes the order number, name, and total", () => {
    const message = buildOrderPaymentWhatsAppMessage({
      orderNumber: "AP-2026-0001",
      customerName: "A Customer",
      total: "Rs 5,000",
    });

    expect(message).toContain("AP-2026-0001");
    expect(message).toContain("A Customer");
    expect(message).toContain("Rs 5,000");
  });
});

describe("buildWhatsAppLink", () => {
  it("normalizes the business number and URL-encodes the message", () => {
    const link = buildWhatsAppLink({
      number: "+92 (300) 123-4567",
      message: "Hello Art Passion! Felt set: Small set",
    });

    expect(link).not.toBeNull();
    const url = new URL(link!);
    expect(url.pathname).toBe("/923001234567");
    expect(url.searchParams.get("text")).toBe(
      "Hello Art Passion! Felt set: Small set",
    );
  });

  it("returns null when no phone number is configured", () => {
    expect(
      buildWhatsAppLink({ number: undefined, message: "Hello" }),
    ).toBeNull();
  });

  it("accepts local 03xx numbers and drops the extra trunk zero in 920…", () => {
    expect(
      new URL(buildWhatsAppLink({ number: "03001234567", message: "Hi" })!).pathname,
    ).toBe("/923001234567");
    expect(
      new URL(buildWhatsAppLink({ number: "9203001234567", message: "Hi" })!).pathname,
    ).toBe("/923001234567");
    expect(
      new URL(buildWhatsAppLink({ number: "923001234567", message: "Hi" })!).pathname,
    ).toBe("/923001234567");
  });
});

describe("normalizeWhatsAppNumber", () => {
  it("strips non-digits and normalizes the common Pakistani forms", () => {
    expect(normalizeWhatsAppNumber("+92 (300) 123-4567")).toBe("923001234567");
    expect(normalizeWhatsAppNumber("0300-1234567")).toBe("923001234567");
    expect(normalizeWhatsAppNumber("9203001234567")).toBe("923001234567");
    // 12-digit 920… form (trunk zero + 9 subscriber digits) loses the zero too.
    expect(normalizeWhatsAppNumber("920332905225")).toBe("92332905225");
    expect(normalizeWhatsAppNumber("923001234567")).toBe("923001234567");
  });

  it("returns null for empty or digit-free input", () => {
    expect(normalizeWhatsAppNumber(undefined)).toBeNull();
    expect(normalizeWhatsAppNumber("")).toBeNull();
    expect(normalizeWhatsAppNumber("TODO(owner): add number")).toBeNull();
  });
});

describe("formatWhatsAppDisplay", () => {
  it("renders a Pakistani mobile as +92 3XX XXXXXXX", () => {
    expect(formatWhatsAppDisplay("03001234567")).toBe("+92 300 1234567");
    expect(formatWhatsAppDisplay("9203001234567")).toBe("+92 300 1234567");
    expect(formatWhatsAppDisplay("+923001234567")).toBe("+92 300 1234567");
  });

  it("returns null when no number is configured", () => {
    expect(formatWhatsAppDisplay(undefined)).toBeNull();
  });
});
