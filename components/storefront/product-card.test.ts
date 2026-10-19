import { describe, expect, it } from "vitest";
import { isProductOutOfStock } from "./product-card";

describe("isProductOutOfStock", () => {
  it("returns true when every variant has zero stock", () => {
    expect(
      isProductOutOfStock({
        madeToOrder: false,
        variants: [{ stock: 0 }, { stock: 0 }],
      }),
    ).toBe(true);
  });

  it("returns false when at least one variant is in stock", () => {
    expect(
      isProductOutOfStock({
        madeToOrder: false,
        variants: [{ stock: 0 }, { stock: 1 }],
      }),
    ).toBe(false);
  });

  it("returns false for made-to-order products with no stock", () => {
    expect(
      isProductOutOfStock({
        madeToOrder: true,
        variants: [{ stock: 0 }],
      }),
    ).toBe(false);
  });
});
