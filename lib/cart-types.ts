export type CartLine = {
  itemId: string;
  variantId: string;
  productTitle: string;
  productSlug: string;
  imageUrl: string | null;
  imageAlt: string;
  variantLabel: string;
  quantity: number;
  unitPrice: number;
  stock: number;
  lineTotal: number;
  available: boolean;
  editable: boolean;
  message: string | null;
};

export type CartView = {
  cartId: string | null;
  items: CartLine[];
  itemCount: number;
  subtotal: number;
  unavailableCount: number;
};

export type CartActionResult = {
  ok: boolean;
  message: string;
  cart: CartView;
};

export function emptyCartView(): CartView {
  return {
    cartId: null,
    items: [],
    itemCount: 0,
    subtotal: 0,
    unavailableCount: 0,
  };
}
