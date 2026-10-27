import { formatPrice } from "@/lib/format";
import type { CartView } from "@/lib/cart-types";

type WhatsAppLinkOptions = {
  number: string | undefined;
  message: string;
};

export function buildCartOrderWhatsAppMessage(cart: CartView): string {
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

export function buildOrderPaymentWhatsAppMessage({
  orderNumber,
  customerName,
  total,
}: {
  orderNumber: string;
  customerName: string;
  total: string;
}): string {
  return [
    "Hello Art Passion! I have sent my Easypaisa payment.",
    `Order number: ${orderNumber}`,
    `Name: ${customerName}`,
    `Total: ${total}`,
    "I have attached the payment screenshot.",
  ].join("\n");
}

export function buildWhatsAppLink({
  number,
  message,
}: WhatsAppLinkOptions): string | null {
  let normalizedNumber = number?.replace(/\D/g, "");

  if (!normalizedNumber) {
    return null;
  }

  if (normalizedNumber.length === 11 && normalizedNumber.startsWith("0")) {
    normalizedNumber = `92${normalizedNumber.slice(1)}`;
  }

  return `https://wa.me/${normalizedNumber}?text=${encodeURIComponent(message)}`;
}
