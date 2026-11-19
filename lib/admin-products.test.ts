import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { db, tx, storageMock, loggerMock, queriesMock } = vi.hoisted(() => {
  const db = {
    imagesMissingAlt: 0,
    orderedVariantIds: [] as string[],
    product: null as null | {
      id: string;
      categoryId?: string;
      variants: Array<{ id: string }>;
      images?: Array<{ publicId: string | null }>;
    },
    deleted: [] as string[],
    deleteError: null as null | Error,
    variantStockUpdateCount: 1,
    variantRow: null as null | { id: string; product: { madeToOrder: boolean } },
    savedProduct: null as unknown,
    txCalls: [] as Array<{ op: string; args: unknown }>,
    events: [] as string[],
  };
  const tx = {
    product: {
      update: vi.fn(async (args: unknown) => {
        db.txCalls.push({ op: "product.update", args });
        return {};
      }),
    },
    variant: {
      update: vi.fn(async (args: unknown) => {
        db.txCalls.push({ op: "variant.update", args });
        return {};
      }),
      updateMany: vi.fn(async (args: unknown) => {
        db.txCalls.push({ op: "variant.updateMany", args });
        return { count: db.variantStockUpdateCount };
      }),
      create: vi.fn(async (args: unknown) => {
        db.txCalls.push({ op: "variant.create", args });
        return {};
      }),
      deleteMany: vi.fn(async () => ({ count: 0 })),
    },
  };
  return {
    db,
    tx,
    storageMock: {
      destroyImage: vi.fn(
        async (publicId: string): Promise<{ ok: boolean; error?: string }> => {
          db.events.push(`destroy:${publicId}`);
          return { ok: true };
        },
      ),
    },
    loggerMock: { warn: vi.fn(), error: vi.fn(), info: vi.fn() },
    queriesMock: { getAdminProduct: vi.fn(async () => db.savedProduct) },
  };
});

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
        if (db.deleteError) throw db.deleteError;
        db.deleted.push(where.id);
        db.events.push("db-delete");
        return { id: where.id };
      }),
    },
    variant: {
      findFirst: vi.fn(async () => null),
      findUnique: vi.fn(async () => db.variantRow),
      updateMany: vi.fn(async () => ({ count: db.variantStockUpdateCount })),
    },
    $transaction: vi.fn(async (fn: (client: typeof tx) => Promise<unknown>) =>
      fn(tx),
    ),
  },
}));

vi.mock("@/lib/storage", () => ({ storage: storageMock }));
vi.mock("@/lib/logger", () => ({ logger: loggerMock }));
vi.mock("@/lib/queries/admin-products", () => ({
  getAdminProduct: queriesMock.getAdminProduct,
}));

import {
  deleteProduct,
  saveProduct,
  stockConflictMessage,
  updateVariantStock,
  validatePublishRequirements,
} from "@/lib/admin-products";
import type { ProductFormData } from "@/lib/admin-product-schema";

beforeEach(() => {
  vi.clearAllMocks();
  db.imagesMissingAlt = 0;
  db.orderedVariantIds = [];
  db.product = null;
  db.deleted = [];
  db.deleteError = null;
  db.variantStockUpdateCount = 1;
  db.variantRow = null;
  db.savedProduct = null;
  db.txCalls = [];
  db.events = [];
});

describe("deleteProduct (hard-delete guard)", () => {
  it("refuses to delete a product whose variant appears in an order", async () => {
    db.product = { id: "p1", variants: [{ id: "v1" }], images: [] };
    db.orderedVariantIds = ["v1"];

    const result = await deleteProduct("p1");

    expect(result).toEqual({ status: "ordered" });
    expect(db.deleted).toHaveLength(0);
    expect(storageMock.destroyImage).not.toHaveBeenCalled();
  });

  it("hard-deletes a never-ordered product", async () => {
    db.product = { id: "p2", variants: [{ id: "v2" }], images: [] };
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

describe("deleteProduct remote asset cleanup", () => {
  it("destroys stored assets only after the database delete succeeds", async () => {
    db.product = {
      id: "p2",
      variants: [{ id: "v2" }],
      images: [{ publicId: "img-1" }, { publicId: null }],
    };

    const result = await deleteProduct("p2");

    expect(result.status).toBe("deleted");
    expect(storageMock.destroyImage).toHaveBeenCalledTimes(1);
    expect(storageMock.destroyImage).toHaveBeenCalledWith("img-1");
    // The DB delete ran before any storage call.
    expect(db.events).toEqual(["db-delete", "destroy:img-1"]);
    expect(loggerMock.warn).not.toHaveBeenCalled();
  });

  it("retries once, logs a fixed event and still reports deleted on persistent failure", async () => {
    db.product = {
      id: "p2",
      variants: [{ id: "v2" }],
      images: [{ publicId: "img-1" }],
    };
    storageMock.destroyImage
      .mockResolvedValueOnce({ ok: false, error: "down" })
      .mockResolvedValueOnce({ ok: false, error: "down" });

    const result = await deleteProduct("p2");

    expect(result.status).toBe("deleted");
    expect(storageMock.destroyImage).toHaveBeenCalledTimes(2);
    expect(loggerMock.warn).toHaveBeenCalledWith(
      "product_delete_asset_cleanup_failed",
    );
  });

  it("never touches storage when the database delete fails", async () => {
    db.product = {
      id: "p2",
      variants: [{ id: "v2" }],
      images: [{ publicId: "img-1" }],
    };
    db.deleteError = new Error("db down");

    await expect(deleteProduct("p2")).rejects.toThrow("db down");
    expect(storageMock.destroyImage).not.toHaveBeenCalled();
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

function formData(overrides: Partial<ProductFormData> = {}): ProductFormData {
  return {
    title: "Felt Set",
    slug: "felt-set",
    description: "A description long enough to pass.",
    categoryId: "c1",
    type: "KIT",
    status: "DRAFT",
    madeToOrder: false,
    leadTimeDays: 3,
    materials: [],
    tags: [],
    variants: [
      { variantId: "v1", label: "S", price: 100, stock: 7, loadedStock: 5 },
    ],
    ...overrides,
  } as ProductFormData;
}

describe("saveProduct publish gate", () => {
  it("blocks publishing a product with no variants", async () => {
    const result = await saveProduct(formData({ status: "PUBLISHED", variants: [] }));

    expect(result).toEqual({
      status: "publish_blocked",
      message: expect.stringMatching(/at least one variant/i),
    });
    expect(db.deleted).toHaveLength(0);
  });
});

describe("saveProduct stock safety", () => {
  beforeEach(() => {
    db.product = { id: "p1", categoryId: "c1", variants: [{ id: "v1" }], images: [] };
  });

  it("writes changed stock conditionally against the loaded baseline", async () => {
    const result = await saveProduct(formData(), "p1");

    expect(result.status).toBe("saved");
    const call = db.txCalls.find((entry) => entry.op === "variant.updateMany");
    expect(call?.args).toMatchObject({
      where: { id: "v1", stock: 5 },
      data: { stock: 7 },
    });
  });

  it("returns stock_conflict when the database no longer holds the baseline", async () => {
    db.variantStockUpdateCount = 0;

    const result = await saveProduct(formData(), "p1");

    expect(result).toEqual({
      status: "stock_conflict",
      message: stockConflictMessage,
    });
  });

  it("never writes stock when the field is unchanged from the baseline", async () => {
    const result = await saveProduct(
      formData({
        variants: [
          { variantId: "v1", label: "S", price: 100, stock: 5, loadedStock: 5 },
        ],
      }),
      "p1",
    );

    expect(result.status).toBe("saved");
    expect(db.txCalls.some((entry) => entry.op === "variant.updateMany")).toBe(false);
    const update = db.txCalls.find((entry) => entry.op === "variant.update");
    expect((update?.args as { data: Record<string, unknown> }).data).not.toHaveProperty("stock");
  });

  it("never writes stock for made-to-order products", async () => {
    const result = await saveProduct(formData({ madeToOrder: true }), "p1");

    expect(result.status).toBe("saved");
    expect(db.txCalls.some((entry) => entry.op === "variant.updateMany")).toBe(false);
    const update = db.txCalls.find((entry) => entry.op === "variant.update");
    expect((update?.args as { data: Record<string, unknown> }).data).not.toHaveProperty("stock");
  });

  it("returns the persisted product so the form can reset from it", async () => {
    db.savedProduct = { id: "p1", title: "Felt Set", variants: [] };

    const result = await saveProduct(formData(), "p1");

    expect(result.status).toBe("saved");
    if (result.status === "saved") {
      expect(result.product).toBe(db.savedProduct);
      expect(result.productId).toBe("p1");
    }
    expect(queriesMock.getAdminProduct).toHaveBeenCalledWith("p1");
  });
});

describe("updateVariantStock (inline editor)", () => {
  it("returns not_found for a missing variant", async () => {
    db.variantRow = null;
    expect(await updateVariantStock("v1", 4, 5)).toEqual({ status: "not_found" });
  });

  it("is a no-op for made-to-order variants", async () => {
    db.variantRow = { id: "v1", product: { madeToOrder: true } };
    expect(await updateVariantStock("v1", 4, 5)).toEqual({ status: "updated" });
  });

  it("is a no-op when the value is unchanged", async () => {
    db.variantRow = { id: "v1", product: { madeToOrder: false } };
    expect(await updateVariantStock("v1", 5, 5)).toEqual({ status: "updated" });
  });

  it("updates conditionally on the loaded baseline", async () => {
    db.variantRow = { id: "v1", product: { madeToOrder: false } };
    db.variantStockUpdateCount = 1;
    expect(await updateVariantStock("v1", 4, 5)).toEqual({ status: "updated" });
  });

  it("reports a conflict when the baseline moved", async () => {
    db.variantRow = { id: "v1", product: { madeToOrder: false } };
    db.variantStockUpdateCount = 0;
    expect(await updateVariantStock("v1", 4, 5)).toEqual({ status: "conflict" });
  });
});