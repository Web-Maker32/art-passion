import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { mocks } = vi.hoisted(() => ({
  mocks: {
    authorized: false,
    saveCalled: 0,
    deleteCalled: 0,
    duplicateCalled: 0,
    archiveCalled: 0,
    stockCalled: 0,
  },
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

vi.mock("@/lib/admin-auth", () => ({
  assertAdmin: vi.fn(async () =>
    mocks.authorized
      ? { authorized: true, userId: "admin-1" }
      : { authorized: false },
  ),
}));

vi.mock("@/lib/admin-products", () => ({
  saveProduct: vi.fn(async () => {
    mocks.saveCalled += 1;
    return { status: "saved", productId: "p1", message: "Product saved." };
  }),
  deleteProduct: vi.fn(async () => {
    mocks.deleteCalled += 1;
    return { status: "deleted", message: "Product deleted." };
  }),
  duplicateProduct: vi.fn(async () => {
    mocks.duplicateCalled += 1;
    return { status: "saved", productId: "p2", message: "Duplicate created." };
  }),
  setProductArchived: vi.fn(async () => {
    mocks.archiveCalled += 1;
    return { status: "changed", newStatus: "HIDDEN" };
  }),
  updateVariantStock: vi.fn(async () => {
    mocks.stockCalled += 1;
    return { status: "updated" };
  }),
}));

import {
  archiveAdminProduct,
  deleteAdminProduct,
  duplicateAdminProduct,
  saveAdminProduct,
  updateAdminVariantStock,
} from "@/actions/admin-products";

const unauthorized = {
  success: false,
  message: "Your session expired. Please sign in again.",
};

const validProduct = {
  title: "Felt Rose Kit",
  slug: "felt-rose-kit",
  description: "A lovely handmade kit for kids.",
  categoryId: "cat-1",
  type: "KIT",
  status: "DRAFT",
  madeToOrder: false,
  leadTimeDays: 3,
  materials: [],
  tags: [],
  variants: [{ label: "Small", price: 1800, stock: 2 }],
};

beforeEach(() => {
  mocks.authorized = false;
  mocks.saveCalled = 0;
  mocks.deleteCalled = 0;
  mocks.duplicateCalled = 0;
  mocks.archiveCalled = 0;
  mocks.stockCalled = 0;
});

describe("admin product actions reject unauthenticated calls", () => {
  it("saveAdminProduct returns the session message and skips the write", async () => {
    const result = await saveAdminProduct(validProduct);
    expect(result).toEqual(unauthorized);
    expect(mocks.saveCalled).toBe(0);
  });

  it("deleteAdminProduct is blocked", async () => {
    const result = await deleteAdminProduct({ productId: "p1" });
    expect(result).toEqual(unauthorized);
    expect(mocks.deleteCalled).toBe(0);
  });

  it("duplicateAdminProduct is blocked", async () => {
    const result = await duplicateAdminProduct({ productId: "p1" });
    expect(result).toEqual(unauthorized);
    expect(mocks.duplicateCalled).toBe(0);
  });

  it("archiveAdminProduct is blocked", async () => {
    const result = await archiveAdminProduct({ productId: "p1" });
    expect(result).toEqual(unauthorized);
    expect(mocks.archiveCalled).toBe(0);
  });

  it("updateAdminVariantStock is blocked", async () => {
    const result = await updateAdminVariantStock({ variantId: "v1", stock: 4 });
    expect(result).toEqual(unauthorized);
    expect(mocks.stockCalled).toBe(0);
  });
});

describe("admin product actions allow an authenticated admin", () => {
  it("reaches the delete logic once authorized", async () => {
    mocks.authorized = true;
    const result = await deleteAdminProduct({ productId: "p1" });
    expect(result.success).toBe(true);
    expect(mocks.deleteCalled).toBe(1);
  });
});
