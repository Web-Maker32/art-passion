/**
 * Single source of truth for storefront availability.
 *
 * A made-to-order product is always purchasable: it ignores physical stock and
 * is only bounded by the per-item quantity maximum. Ready-made variants are
 * available while they have stock. This module is isomorphic (no server-only or
 * Prisma imports) so the purchase panel, cart, cards and queries share one rule.
 */

export const MAX_ITEM_QUANTITY = 20;
export const LOW_STOCK_THRESHOLD = 5;

export type AvailabilityInput = {
  madeToOrder: boolean;
  stock: number;
};

export type StockLabel = "Made to order" | "Out of stock" | "Low stock" | "In stock";

/** A variant can be added to the cart when made-to-order or while stock remains. */
export function isVariantAvailable({ madeToOrder, stock }: AvailabilityInput): boolean {
  return madeToOrder || stock > 0;
}

/** Maximum quantity a shopper may select for a single cart line. */
export function maxQuantityForVariant({ madeToOrder, stock }: AvailabilityInput): number {
  return madeToOrder ? MAX_ITEM_QUANTITY : Math.min(stock, MAX_ITEM_QUANTITY);
}

/** Shopper-facing stock label. Made-to-order never reads "Out of stock". */
export function variantStockLabel({ madeToOrder, stock }: AvailabilityInput): StockLabel {
  if (madeToOrder) return "Made to order";
  if (stock <= 0) return "Out of stock";
  if (stock <= LOW_STOCK_THRESHOLD) return "Low stock";
  return "In stock";
}

/** A product is out of stock only when ready-made and every variant is sold out. */
export function isProductOutOfStock(product: {
  madeToOrder: boolean;
  variants: ReadonlyArray<{ stock: number }>;
}): boolean {
  return (
    !product.madeToOrder &&
    product.variants.length > 0 &&
    product.variants.every((variant) => variant.stock === 0)
  );
}