import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ProductCardData } from "@/lib/queries/products";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ cacheLife: vi.fn() }));

const { findMany } = vi.hoisted(() => ({ findMany: vi.fn() }));
vi.mock("@/lib/db", () => ({ prisma: { product: { findMany } } }));

import {
  getPublishedProducts,
  getRelatedProducts,
} from "@/lib/queries/products";
import { parseProductFilters } from "@/lib/product-filters";

function product(
  slug: string,
  categorySlug = "felt-sets",
  price = 1800,
): ProductCardData {
  return {
    id: slug,
    slug,
    title: slug,
    description: "Handmade set",
    type: "FELT_SET",
    madeToOrder: false,
    createdAt: new Date("2026-11-01T00:00:00Z"),
    category: { name: categorySlug, slug: categorySlug },
    images: [],
    variants: [{ id: `${slug}-variant`, label: "Standard", price, stock: 2 }],
  };
}

beforeEach(() => {
  findMany.mockReset();
});

describe("getPublishedProducts", () => {
  it("filters by categorySlug and retains published-only and newest-first ordering", async () => {
    const matches = [product("newer"), product("older")];
    findMany.mockResolvedValue(matches);

    expect(await getPublishedProducts({ categorySlug: "felt-sets" })).toEqual(
      matches,
    );
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: "PUBLISHED", category: { slug: "felt-sets" } },
        orderBy: { createdAt: "desc" },
      }),
    );
  });

  it("keeps an empty category empty without falling back to the full catalogue", async () => {
    findMany.mockResolvedValue([]);

    expect(
      await getPublishedProducts({ categorySlug: "empty-category" }),
    ).toEqual([]);
    expect(findMany).toHaveBeenCalledTimes(1);
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: "PUBLISHED", category: { slug: "empty-category" } },
      }),
    );
  });

  it("prioritizes the route category over a conflicting query filter", async () => {
    findMany.mockResolvedValue([]);

    await getPublishedProducts({
      categorySlug: "felt-sets",
      filters: parseProductFilters({
        category: "gift-sets",
        type: "FELT_SET",
        inStock: "true",
        minPrice: "1000",
        maxPrice: "4000",
      }),
    });

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          status: "PUBLISHED",
          category: { slug: "felt-sets" },
          type: "FELT_SET",
          variants: {
            some: { stock: { gt: 0 }, price: { gte: 1000, lte: 4000 } },
          },
        },
      }),
    );
  });

  it("still accepts the shop category filter when categorySlug is absent", async () => {
    findMany.mockResolvedValue([]);

    await getPublishedProducts({
      filters: parseProductFilters({ category: "gift-sets" }),
    });

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: "PUBLISHED", category: { slug: "gift-sets" } },
      }),
    );
  });

  it("leaves the unfiltered shop published-only", async () => {
    findMany.mockResolvedValue([]);

    await getPublishedProducts();

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: "PUBLISHED" },
        orderBy: { createdAt: "desc" },
      }),
    );
  });

  it.each([
    ["price-asc", ["cheap", "expensive"]],
    ["price-desc", ["expensive", "cheap"]],
  ] as const)(
    "preserves %s sorting within the category",
    async (sort, expected) => {
      findMany.mockResolvedValue([
        product("expensive", "felt-sets", 3000),
        product("cheap", "felt-sets", 1500),
      ]);

      const result = await getPublishedProducts({
        categorySlug: "felt-sets",
        filters: parseProductFilters({ sort }),
      });

      expect(result.map((item) => item.slug)).toEqual(expected);
    },
  );
});

describe("getRelatedProducts", () => {
  const current = product("current");
  const sameCategory = [
    product("same-1"),
    product("same-2"),
    product("same-3"),
    product("same-4"),
    product("same-5"),
  ];
  const otherCategory = [
    product("other-1", "gift-sets"),
    product("other-2", "painting-kits"),
    product("other-3", "gift-sets"),
    product("other-4", "gift-sets"),
  ];
  const options = { categorySlug: "felt-sets", productSlug: "current" };

  it("shows four other same-category products in order without fetching a fallback", async () => {
    findMany.mockResolvedValue([current, ...sameCategory]);

    expect(await getRelatedProducts(options)).toEqual(sameCategory.slice(0, 4));
    expect(findMany).toHaveBeenCalledTimes(1);
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: "PUBLISHED", category: { slug: "felt-sets" } },
        orderBy: { createdAt: "desc" },
      }),
    );
  });

  it("fills remaining slots with published products, keeping category matches first and excluding duplicates/current", async () => {
    findMany
      .mockResolvedValueOnce([current, sameCategory[0], sameCategory[1]])
      .mockResolvedValueOnce([
        otherCategory[0],
        current,
        sameCategory[0],
        otherCategory[1],
        sameCategory[1],
        otherCategory[2],
      ]);

    expect(await getRelatedProducts(options)).toEqual([
      sameCategory[0],
      sameCategory[1],
      otherCategory[0],
      otherCategory[1],
    ]);
    expect(findMany).toHaveBeenCalledTimes(2);
    expect(findMany).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        where: { status: "PUBLISHED" },
        orderBy: { createdAt: "desc" },
      }),
    );
  });

  it("counts only other products toward the four-slot threshold", async () => {
    findMany
      .mockResolvedValueOnce([current, ...sameCategory.slice(0, 3)])
      .mockResolvedValueOnce([
        current,
        ...sameCategory.slice(0, 3),
        ...otherCategory,
      ]);

    expect(await getRelatedProducts(options)).toEqual([
      ...sameCategory.slice(0, 3),
      otherCategory[0],
    ]);
    expect(findMany).toHaveBeenCalledTimes(2);
  });

  it("uses the full published catalogue when there are no other category matches", async () => {
    findMany
      .mockResolvedValueOnce([current])
      .mockResolvedValueOnce([current, ...otherCategory]);

    expect(await getRelatedProducts(options)).toEqual(otherCategory);
  });

  it("returns fewer than four when the published catalogue is too small", async () => {
    findMany
      .mockResolvedValueOnce([current, sameCategory[0]])
      .mockResolvedValueOnce([current, sameCategory[0], otherCategory[0]]);

    expect(await getRelatedProducts(options)).toEqual([
      sameCategory[0],
      otherCategory[0],
    ]);
  });

  it("returns an empty list when there are no other published products", async () => {
    findMany.mockResolvedValue([current]);

    expect(await getRelatedProducts(options)).toEqual([]);
  });
});
