import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { db, tx } = vi.hoisted(() => {
  const db = {
    count: 0,
    create: vi.fn(),
    failNextTransaction: false,
    transactionCalls: 0,
    siblings: [{ id: "i1", position: 0 }] as Array<{ id: string; position: number }>,
    image: { id: "i1", productId: "p1", position: 0 } as null | { id: string; productId: string; position: number },
  };

  const tx = {
    product: { findUnique: vi.fn(async () => ({ id: "p1" })) },
    productImage: {
      count: vi.fn(async () => db.count),
      findFirst: vi.fn(async () => (db.count > 0 ? { position: db.count - 1 } : null)),
      create: vi.fn(async (args: unknown) => {
        db.create(args);
        return { id: "new" };
      }),
      findMany: vi.fn(async () => db.siblings),
      update: vi.fn(async () => ({})),
      updateMany: vi.fn(async () => ({})),
      findUnique: vi.fn(async () => db.image),
      delete: vi.fn(async () => ({})),
    },
  };

  return { db, tx };
});

vi.mock("@/lib/db", () => ({
  prisma: {
    productImage: tx.productImage,
    $transaction: vi.fn(async (handler: (client: typeof tx) => Promise<unknown>) => {
      db.transactionCalls += 1;
      if (db.failNextTransaction) {
        db.failNextTransaction = false;
        throw Object.assign(new Error("write conflict"), { code: "P2034" });
      }
      return handler(tx);
    }),
  },
}));

vi.mock("@/lib/storage", () => ({
  storage: { destroyImage: vi.fn(async () => ({ ok: true })) },
}));

import { commitProductImage, moveImage } from "@/lib/product-images";
import type { VerifiedImageAsset } from "@/lib/storage";

const asset = {
  publicId: "art-passion/products/abc",
  url: "https://res.cloudinary.com/test-cloud/image/upload/v1/art-passion/products/abc.jpg",
  bytes: 10,
  format: "jpg",
} as unknown as VerifiedImageAsset;

beforeEach(() => {
  db.count = 0;
  db.transactionCalls = 0;
  db.failNextTransaction = false;
  db.siblings = [{ id: "i1", position: 0 }];
  db.image = { id: "i1", productId: "p1", position: 0 };
  db.create.mockReset();
});

describe("commitProductImage", () => {
  it("adds the eighth image and rejects the ninth inside the transaction", async () => {
    db.count = 7;
    const eighth = await commitProductImage({ productId: "p1", asset });
    expect(eighth.status).toBe("ok");
    expect(db.create).toHaveBeenCalledTimes(1);

    db.count = 8;
    const ninth = await commitProductImage({ productId: "p1", asset });
    expect(ninth).toEqual({ status: "limit_reached", message: "A product can have at most 8 images." });
    expect(db.create).toHaveBeenCalledTimes(1);
  });

  it("makes the first image primary and appends the position", async () => {
    db.count = 0;
    await commitProductImage({ productId: "p1", asset });
    expect(db.create).toHaveBeenCalledWith({ data: expect.objectContaining({ position: 0, isPrimary: true }) });

    db.count = 3;
    await commitProductImage({ productId: "p1", asset });
    expect(db.create).toHaveBeenLastCalledWith({ data: expect.objectContaining({ position: 3, isPrimary: false }) });
  });

  it("retries bounded serialization conflicts", async () => {
    db.failNextTransaction = true;
    const result = await commitProductImage({ productId: "p1", asset });
    expect(result.status).toBe("ok");
    expect(db.transactionCalls).toBe(2);
  });
});

describe("moveImage", () => {
  it("leaves the order unchanged at the boundary", async () => {
    db.count = 1;
    const result = await moveImage("i1", "up");
    expect(result).toMatchObject({ status: "ok", message: "Order unchanged." });
    expect(tx.productImage.update).not.toHaveBeenCalled();
  });
});
