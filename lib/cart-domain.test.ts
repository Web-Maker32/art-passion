import { describe, expect, it } from "vitest";
import {
  addQuantityWithinLimits,
  buildCartView,
  type CartItemRecord,
} from "@/lib/cart-domain";

function cartItem(
  overrides: Partial<CartItemRecord> = {},
): CartItemRecord {
  return {
    id: "item-1",
    variantId: "variant-1",
    quantity: 2,
    unitPrice: 1000,
    variant: {
      label: "Small",
      price: 1000,
      stock: 10,
      product: {
        title: "Felt set",
        slug: "felt-set",
        status: "PUBLISHED",
        images: [{ url: "/felt-set.png", alt: "Felt set" }],
      },
    },
    ...overrides,
  };
}

describe("cart domain", () => {
  it("adds repeated variant quantities to the existing line", () => {
    const firstAdd = addQuantityWithinLimits(0, 2, 10);
    const secondAdd = addQuantityWithinLimits(firstAdd.quantity, 3, 10);

    expect(firstAdd.quantity).toBe(2);
    expect(secondAdd).toEqual({ quantity: 5, clamped: false });
  });

  it("clamps additions to available stock and the per-line maximum", () => {
    expect(addQuantityWithinLimits(3, 4, 5)).toEqual({
      quantity: 5,
      clamped: true,
    });
    expect(addQuantityWithinLimits(19, 5, 30)).toEqual({
      quantity: 20,
      clamped: true,
    });
  });

  it("calculates subtotal and item count from available cart lines", () => {
    const cart = buildCartView("cart-1", [
      cartItem(),
      cartItem({
        id: "item-2",
        variantId: "variant-2",
        quantity: 1,
        variant: {
          label: "Large",
          price: 2500,
          stock: 4,
          product: {
            title: "Paint kit",
            slug: "paint-kit",
            status: "PUBLISHED",
            images: [],
          },
        },
      }),
    ]);

    expect(cart.itemCount).toBe(3);
    expect(cart.subtotal).toBe(4500);
    expect(cart.unavailableCount).toBe(0);
  });

  it("flags hidden products and excludes them from the subtotal", () => {
    const cart = buildCartView("cart-1", [
      cartItem({
        variant: {
          ...cartItem().variant,
          product: {
            ...cartItem().variant.product,
            status: "HIDDEN",
          },
        },
      }),
    ]);

    expect(cart.items[0]).toMatchObject({
      available: false,
      message: "No longer available",
    });
    expect(cart.unavailableCount).toBe(1);
    expect(cart.subtotal).toBe(0);
  });

  it("flags sold-out variants as unavailable", () => {
    const cart = buildCartView("cart-1", [
      cartItem({ variant: { ...cartItem().variant, stock: 0 } }),
    ]);

    expect(cart.items[0]).toMatchObject({
      available: false,
      editable: false,
      message: "No longer available",
    });
    expect(cart.subtotal).toBe(0);
  });

  it("uses the current price and flags a changed price", () => {
    const cart = buildCartView("cart-1", [
      cartItem({
        unitPrice: 1000,
        variant: { ...cartItem().variant, price: 1250 },
      }),
    ]);

    expect(cart.items[0]).toMatchObject({
      unitPrice: 1250,
      lineTotal: 2500,
      available: true,
      message: "Price updated",
    });
    expect(cart.subtotal).toBe(2500);
  });

  it("flags cart quantities that exceed reduced stock", () => {
    const cart = buildCartView("cart-1", [
      cartItem({
        quantity: 4,
        variant: { ...cartItem().variant, stock: 2 },
      }),
    ]);

    expect(cart.items[0].available).toBe(false);
    expect(cart.items[0].message).toContain("Only 2 in stock");
  });
});
