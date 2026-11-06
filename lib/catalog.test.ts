import { describe, expect, it } from "vitest";
import { categoryDescriptions, storeCategories } from "@/lib/catalog";

describe("storeCategories", () => {
  it("lists the four shop collections in order", () => {
    expect(storeCategories.map((category) => category.name)).toEqual([
      "Felt Play Sets",
      "Coloring Kits",
      "Painting Kits",
      "Gift Sets",
    ]);
  });

  it("uses unique lowercase-kebab-case slugs", () => {
    const slugs = storeCategories.map((category) => category.slug);

    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) {
      expect(slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    }
  });

  it("gives every category a description", () => {
    for (const category of storeCategories) {
      expect(categoryDescriptions[category.slug]?.trim().length).toBeGreaterThan(
        0,
      );
    }
  });
});
