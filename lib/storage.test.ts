import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { cloud } = vi.hoisted(() => ({
  cloud: {
    uploadCalls: 0,
    destroyCalls: 0,
    fail: false,
    build: null as null | ((options: { public_id: string; folder: string }) => unknown),
  },
}));

vi.mock("cloudinary", () => {
  const uploader = {
    upload_stream: vi.fn((options: { public_id: string; folder: string }, callback: (error: Error | null, result?: unknown) => void) => {
      cloud.uploadCalls += 1;
      const stream = {
        on: vi.fn(() => stream),
        end: vi.fn(() => {
          if (cloud.fail) callback(new Error("provider failure"));
          else callback(null, cloud.build?.(options));
        }),
      };
      return stream;
    }),
    destroy: vi.fn(async () => {
      cloud.destroyCalls += 1;
      return { result: "ok" };
    }),
  };
  return { v2: { config: vi.fn(), uploader } };
});

import { cloudinaryProvider } from "@/lib/storage";

const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0]);

beforeEach(() => {
  cloud.uploadCalls = 0;
  cloud.destroyCalls = 0;
  cloud.fail = false;
  cloud.build = (options) => ({
    public_id: `${options.folder}/${options.public_id}`,
    secure_url: `https://res.cloudinary.com/test-cloud/image/upload/v1700000000/${options.folder}/${options.public_id}.jpg`,
    resource_type: "image",
    format: "jpg",
    bytes: jpeg.byteLength,
  });
});

describe("cloudinaryProvider.uploadImage", () => {
  it("uploads through upload_stream into the fixed folder and returns a verified server-owned asset", async () => {
    const asset = await cloudinaryProvider.uploadImage(jpeg, "image/jpeg");
    expect(cloud.uploadCalls).toBe(1);
    expect(asset.format).toBe("jpg");
    expect(asset.bytes).toBe(jpeg.byteLength);
    expect(asset.publicId.startsWith("art-passion/products/")).toBe(true);
    expect(asset.url).toBe(`https://res.cloudinary.com/test-cloud/image/upload/v1700000000/${asset.publicId}.jpg`);
  });

  it("rejects a response whose byte count does not match the upload and cleans up", async () => {
    cloud.build = (options) => ({
      public_id: `${options.folder}/${options.public_id}`,
      secure_url: `https://res.cloudinary.com/test-cloud/image/upload/v1/${options.folder}/${options.public_id}.jpg`,
      resource_type: "image",
      format: "jpg",
      bytes: jpeg.byteLength + 1,
    });
    await expect(cloudinaryProvider.uploadImage(jpeg, "image/jpeg")).rejects.toThrow(/verified/);
    expect(cloud.destroyCalls).toBe(1);
  });

  it("rejects untrusted delivery URLs and mismatched formats", async () => {
    cloud.build = (options) => ({
      public_id: `${options.folder}/${options.public_id}`,
      secure_url: `https://evil.test/${options.folder}/${options.public_id}.jpg`,
      resource_type: "image",
      format: "jpg",
      bytes: jpeg.byteLength,
    });
    await expect(cloudinaryProvider.uploadImage(jpeg, "image/jpeg")).rejects.toThrow(/verified/);

    cloud.build = (options) => ({
      public_id: `${options.folder}/${options.public_id}`,
      secure_url: `https://res.cloudinary.com/test-cloud/image/upload/v1/${options.folder}/${options.public_id}.png`,
      resource_type: "image",
      format: "png",
      bytes: jpeg.byteLength,
    });
    await expect(cloudinaryProvider.uploadImage(jpeg, "image/jpeg")).rejects.toThrow(/verified/);
  });

  it("never forwards invalid bytes or signatures", async () => {
    await expect(cloudinaryProvider.uploadImage(new Uint8Array(), "image/jpeg")).rejects.toThrow(/Invalid/);
    await expect(cloudinaryProvider.uploadImage(new Uint8Array(4_000_001), "image/jpeg")).rejects.toThrow(/Invalid/);
    await expect(cloudinaryProvider.uploadImage(jpeg, "image/png")).rejects.toThrow(/Invalid/);
    expect(cloud.uploadCalls).toBe(0);
  });

  it("does not expose provider errors", async () => {
    cloud.fail = true;
    await expect(cloudinaryProvider.uploadImage(jpeg, "image/jpeg")).rejects.toThrow("Image upload failed.");
  });
});
