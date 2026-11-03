import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { mocks } = vi.hoisted(() => ({
  mocks: {
    authorized: false,
    productExists: true,
    imageCount: 0,
    signCalled: 0,
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

vi.mock("@/lib/db", () => ({
  prisma: {
    product: {
      findUnique: vi.fn(async () => (mocks.productExists ? { id: "p1" } : null)),
    },
  },
}));

vi.mock("@/lib/storage", () => ({
  storage: {
    signImageUpload: vi.fn(() => {
      mocks.signCalled += 1;
      return {
        uploadUrl: "https://api.cloudinary.com/v1_1/test-cloud/image/upload",
        cloudName: "test-cloud",
        apiKey: "test-api-key",
        timestamp: 1_700_000_000,
        signature: "signed",
        signedParams: { folder: "art-passion/products", allowed_formats: "jpg" },
      };
    }),
    destroyImage: vi.fn(async () => ({ ok: true })),
  },
}));

vi.mock("@/lib/product-images", () => ({
  countProductImages: vi.fn(async () => mocks.imageCount),
  commitProductImage: vi.fn(),
  setPrimaryImage: vi.fn(),
  moveImage: vi.fn(),
  updateImageAlt: vi.fn(),
  deleteImage: vi.fn(),
}));

import { createImageUploadSignature } from "@/actions/admin-images";

beforeEach(() => {
  mocks.authorized = false;
  mocks.productExists = true;
  mocks.imageCount = 0;
  mocks.signCalled = 0;
});

describe("createImageUploadSignature", () => {
  it("refuses without an admin session and never signs", async () => {
    const result = await createImageUploadSignature({
      productId: "p1",
      mimeType: "image/jpeg",
      sizeBytes: 1024,
    });

    expect(result).toEqual({
      success: false,
      message: "Your session expired. Please sign in again.",
    });
    expect(mocks.signCalled).toBe(0);
  });

  it("refuses a disallowed file type before signing", async () => {
    mocks.authorized = true;

    const result = await createImageUploadSignature({
      productId: "p1",
      mimeType: "image/gif",
      sizeBytes: 1024,
    });

    expect(result.success).toBe(false);
    expect(mocks.signCalled).toBe(0);
  });

  it("refuses an oversized file before signing", async () => {
    mocks.authorized = true;

    const result = await createImageUploadSignature({
      productId: "p1",
      mimeType: "image/png",
      sizeBytes: 6 * 1024 * 1024,
    });

    expect(result.success).toBe(false);
    expect(mocks.signCalled).toBe(0);
  });

  it("signs a valid request for an authenticated admin", async () => {
    mocks.authorized = true;

    const result = await createImageUploadSignature({
      productId: "p1",
      mimeType: "image/webp",
      sizeBytes: 2048,
    });

    expect(result.success).toBe(true);
    expect(mocks.signCalled).toBe(1);
  });
});
