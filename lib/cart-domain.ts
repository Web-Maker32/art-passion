import type { CartLine, CartView } from "@/lib/cart-types";
import {
  isVariantAvailable,
  maxQuantityForVariant,
} from "@/lib/availability";

export type CartItemRecord = {
  id: string;
  variantId: string;
  quantity: number;
  unitPrice: number;
  variant: {
    label: string;
    price: number;
    stock: number;
    product: {
      title: string;
      slug: string;
      status: "DRAFT" | "PUBLISHED" | "HIDDEN";
      madeToOrder?: boolean;
      images: Array<{ url: string; alt: string }>;
    };
  };
};

export function addQuantityWithinLimits(
  currentQuantity: number,
  requestedQuantity: number,
  stock: number,
  madeToOrder = false,
): { quantity: number; clamped: boolean } {
  const quantity = Math.min(
    currentQuantity + requestedQuantity,
    maxQuantityForVariant({ madeToOrder, stock }),
  );
  return {
    quantity,
    clamped: quantity !== currentQuantity + requestedQuantity,
  };
}

export function buildCartView(
  cartId: string | null,
  records: CartItemRecord[],
): CartView {
  const items: CartLine[] = records.map((record) => {
    const { product } = record.variant;
    const madeToOrder = product.madeToOrder ?? false;
    const availability = { madeToOrder, stock: record.variant.stock };
    const published = product.status === "PUBLISHED";
    const available = isVariantAvailable(availability);
    const exceedsStock = !madeToOrder && record.quantity > record.variant.stock;
    const unavailable = !published || !available || exceedsStock;

    let message: string | null = null;
    if (!published || !available) {
      message = "No longer available";
    } else if (exceedsStock) {
      message = `Only ${record.variant.stock} in stock. Reduce the quantity to continue.`;
    } else if (record.unitPrice !== record.variant.price) {
      message = "Price updated";
    }

    return {
      itemId: record.id,
      variantId: record.variantId,
      productTitle: product.title,
      productSlug: product.slug,
      imageUrl: product.images[0]?.url ?? null,
      imageAlt: product.images[0]?.alt || product.title,
      variantLabel: record.variant.label,
      quantity: record.quantity,
      unitPrice: record.variant.price,
      stock: record.variant.stock,
      madeToOrder,
      maxQuantity: maxQuantityForVariant(availability),
      lineTotal: record.variant.price * record.quantity,
      available: !unavailable,
      editable: published && available,
      message,
    };
  });

  return {
    cartId,
    items,
    itemCount: items.reduce((count, item) => count + item.quantity, 0),
    subtotal: items.reduce(
      (total, item) => total + (item.available ? item.lineTotal : 0),
      0,
    ),
    unavailableCount: items.filter((item) => !item.available).length,
  };
}
