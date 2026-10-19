import type { CartLine, CartView } from "@/lib/cart-types";

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
      images: Array<{ url: string; alt: string }>;
    };
  };
};

export function addQuantityWithinLimits(
  currentQuantity: number,
  requestedQuantity: number,
  stock: number,
): { quantity: number; clamped: boolean } {
  const quantity = Math.min(currentQuantity + requestedQuantity, stock, 20);
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
    const unavailable =
      product.status !== "PUBLISHED" ||
      record.variant.stock <= 0 ||
      record.quantity > record.variant.stock;

    let message: string | null = null;
    if (product.status !== "PUBLISHED" || record.variant.stock <= 0) {
      message = "No longer available";
    } else if (record.quantity > record.variant.stock) {
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
      lineTotal: record.variant.price * record.quantity,
      available: !unavailable,
      editable: product.status === "PUBLISHED" && record.variant.stock > 0,
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
