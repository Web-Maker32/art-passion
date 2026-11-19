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
  const normalizedNumber = normalizeWhatsAppNumber(number);
  if (!normalizedNumber) {
    return null;
  }

  return `https://wa.me/${normalizedNumber}?text=${encodeURIComponent(message)}`;
}

/**
 * Normalizes a Pakistani WhatsApp number to international digits-only form.
 * Accepts local 03xx…, +92… and 92… inputs, and drops the extra trunk zero
 * some owners type after the country code (920…). Returns null when no digits
 * are present.
 */
export function normalizeWhatsAppNumber(
  number: string | undefined,
): string | null {
  let digits = number?.replace(/\D/g, "") ?? "";
  if (!digits) return null;

  // Local format 03xx… (11 digits) → international 92…
  if (digits.length === 11 && digits.startsWith("0")) {
    digits = `92${digits.slice(1)}`;
  }
  // Pakistani subscriber numbers never start with 0 after the 92 country
  // code, so a 920… prefix always carries a stray trunk zero — drop it.
  if (digits.startsWith("920")) {
    digits = `92${digits.slice(3)}`;
  }

  return digits;
}

/**
 * Human-friendly display form, e.g. +92 300 1234567. Falls back to a leading
 * plus for numbers that are not a standard Pakistani mobile.
 */
export function formatWhatsAppDisplay(
  number: string | undefined,
): string | null {
  const normalized = normalizeWhatsAppNumber(number);
  if (!normalized) return null;

  if (normalized.length === 12 && normalized.startsWith("92")) {
    const local = normalized.slice(2);
    return `+92 ${local.slice(0, 3)} ${local.slice(3)}`;
  }
  return `+${normalized}`;
}
