import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { db } = vi.hoisted(() => ({
  db: {
    imagesMissingAlt: 0,
    orderedVariantIds: [] as string[],
    product: null as null | { id: string; variants: Array<{ id: string }> },
    deleted: [] as string[],
  },
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    productImage: {
      count: vi.fn(async () => db.imagesMissingAlt),
    },
    orderItem: {
      findMany: vi.fn(
        async ({ where }: { where: { variantId: { in: string[] } } }) =>
          where.variantId.in
            .filter((id) => db.orderedVariantIds.includes(id))
            .map((variantId) => ({ variantId })),
      ),
    },
    product: {
      findUnique: vi.fn(async () => db.product),
      delete: vi.fn(async ({ where }: { where: { id: string } }) => {
        db.deleted.push(where.id);
        return { id: where.id };
      }),
    },
  },
}));

import {
  deleteProduct,
  saveProduct,
  validatePublishRequirements,
} from "@/lib/admin-products";

beforeEach(() => {
  db.imagesMissingAlt = 0;
  db.orderedVariantIds = [];
  db.product = null;
  db.deleted = [];
});

describe("deleteProduct (hard-delete guard)", () => {
  it("refuses to delete a product whose variant appears in an order", async () => {
    db.product = { id: "p1", variants: [{ id: "v1" }] };
    db.orderedVariantIds = ["v1"];

    const result = await deleteProduct("p1");

    expect(result).toEqual({ status: "ordered" });
    expect(db.deleted).toHaveLength(0);
  });

  it("hard-deletes a never-ordered product", async () => {
    db.product = { id: "p2", variants: [{ id: "v2" }] };
    db.orderedVariantIds = [];

    const result = await deleteProduct("p2");

    expect(result.status).toBe("deleted");
    expect(db.deleted).toEqual(["p2"]);
  });

  it("returns not_found for a missing product", async () => {
    db.product = null;

    const result = await deleteProduct("nope");

    expect(result).toEqual({ status: "not_found" });
    expect(db.deleted).toHaveLength(0);
  });
});

describe("validatePublishRequirements", () => {
  it("requires at least one variant", async () => {
    const error = await validatePublishRequirements({ variants: [] });
    expect(error).toMatch(/at least one variant/i);
  });

  it("requires alt text on every image once images exist", async () => {
    db.imagesMissingAlt = 2;

    const error = await validatePublishRequirements({
      productId: "p1",
      variants: [{ label: "S", price: 100, stock: 1, sku: null }],
    });

    expect(error).toMatch(/alt text/i);
  });

  it("passes with a variant and no missing alt text", async () => {
    db.imagesMissingAlt = 0;

    const error = await validatePublishRequirements({
      productId: "p1",
      variants: [{ label: "S", price: 100, stock: 1, sku: null }],
    });

    expect(error).toBeNull();
  });
});

describe("saveProduct publish gate", () => {
  it("blocks publishing a product with no variants", async () => {
    const result = await saveProduct({
      title: "Tiny Thing",
      slug: "tiny-thing",
      description: "A description long enough to pass.",
      categoryId: "c1",
      type: "KIT",
      status: "PUBLISHED",
      madeToOrder: false,
      leadTimeDays: 3,
      materials: [],
      tags: [],
      variants: [],
    });

    expect(result).toEqual({
      status: "publish_blocked",
      message: expect.stringMatching(/at least one variant/i),
    });
    expect(db.deleted).toHaveLength(0);
  });
});
