import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { db } = vi.hoisted(() => ({
  db: {
    product: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
    category: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock("@/lib/db", () => ({ prisma: db }));

import {
  ADMIN_PRODUCTS_PAGE_SIZE,
  ADMIN_PRODUCT_SEARCH_MAX_LENGTH,
  listAdminProducts,
  listCategoriesForAdmin,
} from "@/lib/queries/admin-products";

beforeEach(() => {
  vi.clearAllMocks();
  db.product.count.mockResolvedValue(0);
  db.product.findMany.mockResolvedValue([]);
  db.category.findMany.mockResolvedValue([]);
});

describe("listAdminProducts", () => {
  it("lists newest first with bounded pagination and aggregated prices and stock", async () => {
    db.product.count.mockResolvedValue(30);
    db.product.findMany.mockResolvedValue([
      {
        id: "p1",
        title: "Resin tray",
        slug: "resin-tray",
        status: "PUBLISHED",
        madeToOrder: false,
        images: [{ url: "https://img/1.jpg", alt: "Tray" }],
        variants: [
          { id: "v1", label: "Small", sku: "RT-S", price: 1200, stock: 3 },
          { id: "v2", label: "Large", sku: "RT-L", price: 2000, stock: 1 },
        ],
      },
    ]);

    const result = await listAdminProducts({ page: 2 });

    const listCall = db.product.findMany.mock.calls[0]?.[0];
    expect(listCall.orderBy).toEqual({ createdAt: "desc" });
    expect(listCall.skip).toBe(ADMIN_PRODUCTS_PAGE_SIZE);
    expect(listCall.take).toBe(ADMIN_PRODUCTS_PAGE_SIZE);
    expect(result.total).toBe(30);
    expect(result.totalPages).toBe(3);
    expect(result.page).toBe(2);

    const product = result.products[0];
    expect(product.minPrice).toBe(1200);
    expect(product.maxPrice).toBe(2000);
    expect(product.totalStock).toBe(4);
    expect(product.thumbnail).toEqual({
      url: "https://img/1.jpg",
      alt: "Tray",
    });
  });

  it("trims and caps the search term and matches title or variant SKU", async () => {
    const longSearch = `  ${"a".repeat(200)}  `;
    await listAdminProducts({ search: longSearch });

    const listCall = db.product.findMany.mock.calls[0]?.[0];
    const expected = "a".repeat(ADMIN_PRODUCT_SEARCH_MAX_LENGTH);
    expect(listCall.where.OR).toEqual([
      { title: { contains: expected, mode: "insensitive" } },
      {
        variants: {
          some: { sku: { contains: expected, mode: "insensitive" } },
        },
      },
    ]);
    // The count uses the same bounded search.
    expect(db.product.count.mock.calls[0]?.[0].where.OR).toEqual(
      listCall.where.OR,
    );
  });

  it("ignores blank search terms", async () => {
    await listAdminProducts({ search: "   " });
    expect(db.product.findMany.mock.calls[0]?.[0].where.OR).toBeUndefined();
  });

  it("filters by category", async () => {
    await listAdminProducts({ categoryId: "cat-1" });
    const where = db.product.findMany.mock.calls[0]?.[0].where;
    expect(where.categoryId).toBe("cat-1");
    expect(db.product.count.mock.calls[0]?.[0].where.categoryId).toBe("cat-1");
  });

  it("filters by status and combines with category and search", async () => {
    await listAdminProducts({
      status: "DRAFT",
      categoryId: "cat-1",
      search: "tray",
    });
    const where = db.product.findMany.mock.calls[0]?.[0].where;
    expect(where.status).toBe("DRAFT");
    expect(where.categoryId).toBe("cat-1");
    expect(where.OR).toBeDefined();
  });

  it("shows in-stock products with at least one stocked variant", async () => {
    await listAdminProducts({ stock: "in" });
    const where = db.product.findMany.mock.calls[0]?.[0].where;
    expect(where.madeToOrder).toBe(false);
    expect(where.variants).toEqual({ some: { stock: { gt: 0 } } });
  });

  it("shows low-stock products with a variant at 1-2 units", async () => {
    await listAdminProducts({ stock: "low" });
    const where = db.product.findMany.mock.calls[0]?.[0].where;
    expect(where.madeToOrder).toBe(false);
    expect(where.variants).toEqual({
      some: { stock: { gt: 0, lte: 2 } },
    });
  });

  it("shows out-of-stock products only when every variant is zero", async () => {
    await listAdminProducts({ stock: "out" });
    const where = db.product.findMany.mock.calls[0]?.[0].where;
    expect(where.madeToOrder).toBe(false);
    expect(where.AND).toEqual([
      { variants: { some: {} } },
      { variants: { every: { stock: 0 } } },
    ]);
  });

  it("adds no stock constraints for the default filter", async () => {
    await listAdminProducts({ stock: "all" });
    const where = db.product.findMany.mock.calls[0]?.[0].where;
    expect(where.madeToOrder).toBeUndefined();
    expect(where.variants).toBeUndefined();
    expect(where.AND).toBeUndefined();
  });

  it("clamps invalid pages to the first page", async () => {
    const result = await listAdminProducts({ page: -5 });
    expect(result.page).toBe(1);
    expect(db.product.findMany.mock.calls[0]?.[0].skip).toBe(0);
  });

  it("returns a calm empty result for an empty catalogue", async () => {
    const result = await listAdminProducts();
    expect(result.products).toEqual([]);
    expect(result.total).toBe(0);
    expect(result.totalPages).toBe(1);
  });

  it("handles products without variants or images", async () => {
    db.product.findMany.mockResolvedValue([
      {
        id: "p2",
        title: "Made to order piece",
        slug: "mto-piece",
        status: "PUBLISHED",
        madeToOrder: true,
        images: [],
        variants: [],
      },
    ]);

    const result = await listAdminProducts();
    const product = result.products[0];
    expect(product.minPrice).toBeNull();
    expect(product.maxPrice).toBeNull();
    expect(product.totalStock).toBe(0);
    expect(product.thumbnail).toBeNull();
    expect(product.madeToOrder).toBe(true);
  });
});

describe("listCategoriesForAdmin", () => {
  it("returns categories ordered by name with only safe fields", async () => {
    db.category.findMany.mockResolvedValue([
      { id: "c1", name: "Resin art", slug: "resin-art" },
    ]);

    const categories = await listCategoriesForAdmin();

    const call = db.category.findMany.mock.calls[0]?.[0];
    expect(call.orderBy).toEqual({ name: "asc" });
    expect(call.select).toEqual({ id: true, name: true, slug: true });
    expect(categories).toEqual([
      { id: "c1", name: "Resin art", slug: "resin-art" },
    ]);
  });
});
