import { siteConfig } from "@/lib/site-config";

export function calculateShippingFee(subtotal: number): number {
  if (!Number.isInteger(subtotal) || subtotal < 0) {
    throw new RangeError("Shipping requires a whole-rupee subtotal of zero or more.");
  }
  if (subtotal === 0) return 0;
  if (subtotal >= siteConfig.freeDeliveryThreshold) return 0;
  return siteConfig.deliveryFee;
}
