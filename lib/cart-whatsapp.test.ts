import { describe, expect, it } from "vitest";
import { buildCartWhatsAppMessage } from "@/lib/cart-whatsapp";
import type { CartView } from "@/lib/cart-types";

describe("buildCartWhatsAppMessage", () => {
  it("lists each item, variant, quantity, line total, and subtotal", () => {
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
          unitPrice: 125000,
          stock: 4,
          lineTotal: 250000,
          available: true,
          editable: true,
          message: null,
        },
      ],
      itemCount: 2,
      subtotal: 250000,
      unavailableCount: 0,
    };

    const message = buildCartWhatsAppMessage(cart);
    expect(message).toContain("Felt play set (Rainbow) × 2");
    expect(message).toContain("2,500");
    expect(message).toContain("Subtotal:");
  });
});
