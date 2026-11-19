import { describe, expect, it } from "vitest";
import {
  MAX_ITEM_QUANTITY,
  isProductOutOfStock,
  isVariantAvailable,
  maxQuantityForVariant,
  variantStockLabel,
} from "@/lib/availability";

describe("isVariantAvailable", () => {
  it("treats made-to-order variants as available even with zero stock", () => {
    expect(isVariantAvailable({ madeToOrder: true, stock: 0 })).toBe(true);
    expect(isVariantAvailable({ madeToOrder: true, stock: 5 })).toBe(true);
  });

  it("requires physical stock for ready-made variants", () => {
    expect(isVariantAvailable({ madeToOrder: false, stock: 0 })).toBe(false);
    expect(isVariantAvailable({ madeToOrder: false, stock: 1 })).toBe(true);
  });
});

describe("maxQuantityForVariant", () => {
  it("bounds made-to-order lines by the per-item maximum, not stock", () => {
    expect(maxQuantityForVariant({ madeToOrder: true, stock: 0 })).toBe(
      MAX_ITEM_QUANTITY,
    );
    expect(maxQuantityForVariant({ madeToOrder: true, stock: 3 })).toBe(
      MAX_ITEM_QUANTITY,
    );
  });

  it("bounds ready-made lines by stock and the per-item maximum", () => {
    expect(maxQuantityForVariant({ madeToOrder: false, stock: 3 })).toBe(3);
    expect(maxQuantityForVariant({ madeToOrder: false, stock: 30 })).toBe(
      MAX_ITEM_QUANTITY,
    );
    expect(maxQuantityForVariant({ madeToOrder: false, stock: 0 })).toBe(0);
  });
});

describe("variantStockLabel", () => {
  it("never labels a made-to-order variant out of stock", () => {
    expect(variantStockLabel({ madeToOrder: true, stock: 0 })).toBe(
      "Made to order",
    );
    expect(variantStockLabel({ madeToOrder: true, stock: 9 })).toBe(
      "Made to order",
    );
  });

  it("labels ready-made stock levels", () => {
    expect(variantStockLabel({ madeToOrder: false, stock: 0 })).toBe(
      "Out of stock",
    );
    expect(variantStockLabel({ madeToOrder: false, stock: 5 })).toBe(
      "Low stock",
    );
    expect(variantStockLabel({ madeToOrder: false, stock: 6 })).toBe(
      "In stock",
    );
  });
});

describe("isProductOutOfStock", () => {
  it("is false for made-to-order products regardless of stock", () => {
    expect(
      isProductOutOfStock({ madeToOrder: true, variants: [{ stock: 0 }] }),
    ).toBe(false);
  });

  it("is true only when every ready-made variant is sold out", () => {
    expect(
      isProductOutOfStock({
        madeToOrder: false,
        variants: [{ stock: 0 }, { stock: 0 }],
      }),
    ).toBe(true);
    expect(
      isProductOutOfStock({
        madeToOrder: false,
        variants: [{ stock: 0 }, { stock: 2 }],
      }),
    ).toBe(false);
  });

  it("is false when there are no variants", () => {
    expect(isProductOutOfStock({ madeToOrder: false, variants: [] })).toBe(
      false,
    );
  });
});