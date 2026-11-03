import { describe, expect, it } from "vitest";
import {
  productFormSchema,
  slugifyTitle,
  slugSchema,
  variantInputSchema,
} from "@/lib/admin-product-schema";

describe("slugifyTitle", () => {
  it("lowercases and hyphenates a title", () => {
    expect(slugifyTitle("Felt Rose Kit")).toBe("felt-rose-kit");
  });

  it("strips diacritics and collapses unsafe characters", () => {
    expect(slugifyTitle("Crème Kit")).toBe("creme-kit");
    expect(slugifyTitle("  Big   Deal! ")).toBe("big-deal");
  });

  it("returns an empty string when nothing is URL-safe", () => {
    expect(slugifyTitle("!!!")).toBe("");
  });
});

describe("slugSchema", () => {
  it("accepts a safe slug", () => {
    expect(slugSchema.safeParse("felt-rose-kit").success).toBe(true);
    expect(slugSchema.safeParse("kit2").success).toBe(true);
  });

  it("rejects uppercase, spaces and double hyphens", () => {
    expect(slugSchema.safeParse("Felt-Kit").success).toBe(false);
    expect(slugSchema.safeParse("felt kit").success).toBe(false);
    expect(slugSchema.safeParse("felt--kit").success).toBe(false);
  });

  it("rejects leading/trailing hyphens and too-short slugs", () => {
    expect(slugSchema.safeParse("-felt").success).toBe(false);
    expect(slugSchema.safeParse("felt-").success).toBe(false);
    expect(slugSchema.safeParse("a").success).toBe(false);
  });
});

describe("variantInputSchema (whole-PKR money rules)", () => {
  const base = { label: "Small", stock: 3 };

  it("accepts a positive integer price and coerces numeric strings", () => {
    const parsed = variantInputSchema.safeParse({ ...base, price: "1800" });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.price).toBe(1800);
  });

  it("rejects zero, negative and fractional prices", () => {
    expect(variantInputSchema.safeParse({ ...base, price: 0 }).success).toBe(false);
    expect(variantInputSchema.safeParse({ ...base, price: -5 }).success).toBe(false);
    expect(variantInputSchema.safeParse({ ...base, price: 10.5 }).success).toBe(false);
  });

  it("rejects negative stock", () => {
    expect(
      variantInputSchema.safeParse({ label: "S", price: 100, stock: -1 }).success,
    ).toBe(false);
  });

  it("allows an omitted or empty SKU but rejects unsafe SKU characters", () => {
    expect(variantInputSchema.safeParse({ ...base, price: 100 }).success).toBe(true);
    expect(variantInputSchema.safeParse({ ...base, price: 100, sku: "" }).success).toBe(
      true,
    );
    expect(
      variantInputSchema.safeParse({ ...base, price: 100, sku: "bad sku!" }).success,
    ).toBe(false);
  });
});

describe("productFormSchema", () => {
  const valid = {
    title: "Felt Rose Kit",
    slug: "felt-rose-kit",
    description: "A lovely handmade kit for kids.",
    categoryId: "cat-1",
    type: "KIT",
    status: "DRAFT",
    madeToOrder: false,
    leadTimeDays: 3,
    variants: [{ label: "Small", price: 1800, stock: 2 }],
  };

  it("accepts a valid draft product and defaults materials/tags", () => {
    const parsed = productFormSchema.safeParse(valid);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.materials).toEqual([]);
      expect(parsed.data.tags).toEqual([]);
    }
  });

  it("rejects a too-short description", () => {
    expect(productFormSchema.safeParse({ ...valid, description: "short" }).success).toBe(
      false,
    );
  });

  it("rejects an unknown status or type", () => {
    expect(productFormSchema.safeParse({ ...valid, status: "LIVE" }).success).toBe(false);
    expect(productFormSchema.safeParse({ ...valid, type: "TOY" }).success).toBe(false);
  });

  it("rejects a lead time outside 1..365 days", () => {
    expect(productFormSchema.safeParse({ ...valid, leadTimeDays: 0 }).success).toBe(false);
    expect(productFormSchema.safeParse({ ...valid, leadTimeDays: 400 }).success).toBe(
      false,
    );
  });
});
