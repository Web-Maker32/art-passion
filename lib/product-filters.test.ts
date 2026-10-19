import { describe, expect, it } from "vitest";
import {
  parseProductFilters,
  productFilterSchema,
} from "@/lib/product-filters";

describe("productFilterSchema", () => {
  it("validates and coerces supported URL filter values", () => {
    expect(
      productFilterSchema.parse({
        category: "felt-sets",
        type: "FELT_SET",
        minPrice: "1000",
        maxPrice: "5000",
        inStock: "true",
        sort: "price-asc",
        page: "2",
      }),
    ).toEqual({
      category: "felt-sets",
      type: "FELT_SET",
      minPrice: 1000,
      maxPrice: 5000,
      inStock: true,
      sort: "price-asc",
      page: 2,
    });
  });

  it("rejects invalid product types, prices, and inverted ranges", () => {
    expect(
      productFilterSchema.safeParse({ type: "UNKNOWN" }).success,
    ).toBe(false);
    expect(
      productFilterSchema.safeParse({ minPrice: 5000, maxPrice: 1000 })
        .success,
    ).toBe(false);
    expect(productFilterSchema.safeParse({ page: "0" }).success).toBe(false);
  });

  it("uses safe defaults for invalid URL parameters", () => {
    expect(parseProductFilters({ type: "not-a-type", page: "0" })).toEqual({
      inStock: false,
      sort: "newest",
      page: 1,
    });
  });
});
