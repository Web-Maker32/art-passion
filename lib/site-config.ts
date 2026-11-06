/**
 * Single source of truth for storefront content and business details.
 *
 * Values that only the owner can supply are marked with `TODO(owner)`.
 * Replace them (or set the matching environment variable) before launch.
 * Never copy these values into another component or page.
 */

const TODO_PREFIX = "TODO(owner): ";

function ownerTodo(detail: string): string {
  return `${TODO_PREFIX}${detail}`;
}

function positiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export const siteConfig = {
  storeName: "Art Passion",
  tagline: "the passion of art",
  whatsappNumber:
    process.env.WHATSAPP_NUMBER?.trim() ||
    ownerTodo("add the WhatsApp number in international format, digits only"),
  contactEmail:
    process.env.CONTACT_EMAIL?.trim() ||
    ownerTodo("add the shop contact email address"),
  instagramUrl:
    process.env.INSTAGRAM_URL?.trim() ||
    ownerTodo("add the Instagram profile URL"),
  facebookUrl:
    process.env.FACEBOOK_URL?.trim() ||
    ownerTodo("add the Facebook page URL"),
  city:
    process.env.SHOP_CITY?.trim() || ownerTodo("add the shop city"),
  country: "Pakistan",
  deliveryFee: positiveInteger(process.env.SHIPPING_FLAT_RATE, 350),
  freeDeliveryThreshold: positiveInteger(
    process.env.FREE_SHIPPING_THRESHOLD,
    5000,
  ),
  easypaisaAccountName:
    process.env.EASYPAISA_ACCOUNT_NAME?.trim() ||
    ownerTodo("add the Easypaisa account holder name"),
  easypaisaNumber:
    process.env.EASYPAISA_NUMBER?.trim() ||
    ownerTodo("add the Easypaisa mobile number"),
} as const;

/**
 * The delivery line shown in the footer, product pages and shipping content.
 * Derived from siteConfig so the amount is never written twice.
 */
export const deliveryInfoLine = `Flat Rs ${siteConfig.deliveryFee} delivery, free over Rs ${siteConfig.freeDeliveryThreshold}`;

export function isOwnerTodo(value: string): boolean {
  return value.startsWith(TODO_PREFIX);
}
