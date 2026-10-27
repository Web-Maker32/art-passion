import { env } from "@/lib/env";

export function calculateShippingFee(subtotal: number): number {
  if (!Number.isInteger(subtotal) || subtotal < 0) {
    throw new RangeError("Shipping requires a whole-rupee subtotal of zero or more.");
  }
  if (subtotal === 0) return 0;
  if (subtotal >= env.FREE_SHIPPING_THRESHOLD) return 0;
  return env.SHIPPING_FLAT_RATE;
}
