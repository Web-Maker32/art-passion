import { formatPrice } from "@/lib/format";
import type { CartView } from "@/lib/cart-types";

export function buildCartWhatsAppMessage(cart: CartView): string {
  const lines = cart.items.map(
    (item) =>
      `- ${item.productTitle} (${item.variantLabel}) × ${item.quantity}: ${formatPrice(item.lineTotal)}${item.message ? ` — ${item.message}` : ""}`,
  );

  return [
    "Hello Art Passion! I would like to order:",
    ...(lines.length ? lines : ["- My cart is empty."]),
    `Subtotal: ${formatPrice(cart.subtotal)}`,
  ].join("\n");
}
