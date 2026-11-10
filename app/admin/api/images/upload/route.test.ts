// @vitest-environment node
// The route only touches Request/Response; jsdom's File global is incompatible
// with Node's multipart parser, so this suite runs in the node environment.
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { mocks } = vi.hoisted(() => ({
  mocks: {
    authorized: true,
    uploadImage: vi.fn(),
    destroyImage: vi.fn(async () => ({ ok: true })),
    commitProductImage: vi.fn(),
    revalidateImagePaths: vi.fn(async () => {}),
    productExists: true,
    committedRow: null as { id: string } | null,
  },
}));

vi.mock("@/lib/admin-auth", () => ({
  assertAdmin: vi.fn(async () => (mocks.authorized ? { authorized: true, userId: "admin-1" } : { authorized: false })),
}));
vi.mock("@/lib/db", () => ({
  prisma: {
    product: { findUnique: vi.fn(async () => (mocks.productExists ? { id: "p1" } : null)) },
    productImage: { findFirst: vi.fn(async () => mocks.committedRow) },
  },
}));
vi.mock("@/lib/storage", () => ({ storage: { uploadImage: mocks.uploadImage, destroyImage: mocks.destroyImage } }));
vi.mock("@/lib/product-images", () => ({ commitProductImage: mocks.commitProductImage }));
vi.mock("@/lib/revalidate-product-images", () => ({ revalidateImagePaths: mocks.revalidateImagePaths }));

import { POST } from "@/app/admin/api/images/upload/route";

const url = "https://shop.test/admin/api/images/upload";
const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]);
const asset = { publicId: "art-passion/products/abc", url: "https://res.cloudinary.com/test-cloud/image/upload/v1/art-passion/products/abc.jpg", bytes: 10, format: "jpg" };
const images = [{ id: "i1", url: asset.url, alt: "", position: 0, isPrimary: true, publicId: asset.publicId }];

function pad(bytes: Uint8Array, size: number): Uint8Array {
  if (bytes.byteLength === size) return bytes;
  const out = new Uint8Array(size);
  out.set(bytes);
  return out;
}

type MultipartOptions = {
  type?: string;
  name?: string;
  extra?: Record<string, string>;
  declaredLength?: number | null;
  origin?: string | null;
  header?: string | null;
};

// Built by hand: jsdom's FormData is not recognized by the Node Response used
// in tests, so `new Response(form)` would not produce a parseable multipart body.
function encodeMultipart(bytes: Uint8Array, options: MultipartOptions): { body: Uint8Array; contentType: string } {
  const boundary = "----artpassiontestboundary";
  const encoder = new TextEncoder();
  const chunks: Uint8Array[] = [];
  const text = (value: string) => chunks.push(encoder.encode(value));
  text(`--${boundary}\r\nContent-Disposition: form-data; name="productId"\r\n\r\np1\r\n`);
  text(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${options.name ?? "photo.jpg"}"\r\nContent-Type: ${options.type ?? "image/jpeg"}\r\n\r\n`);
  chunks.push(bytes);
  text("\r\n");
  for (const [key, value] of Object.entries(options.extra ?? {})) {
    text(`--${boundary}\r\nContent-Disposition: form-data; name="${key}"\r\n\r\n${value}\r\n`);
  }
  text(`--${boundary}--\r\n`);
  const body = new Uint8Array(chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0));
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return { body, contentType: `multipart/form-data; boundary=${boundary}` };
}

async function multipart(bytes: Uint8Array, options: MultipartOptions = {}): Promise<Request> {
  const { body, contentType } = encodeMultipart(bytes, options);
  const request = new Request(url, {
    method: "POST",
    body: body.buffer as ArrayBuffer,
    headers: {
      "content-type": contentType,
      origin: options.origin === undefined ? "https://shop.test" : options.origin ?? "",
      "x-admin-upload": options.header === undefined ? "1" : options.header ?? "",
      "sec-fetch-site": "same-origin",
    },
  });
  if (options.declaredLength === null) request.headers.delete("content-length");
  if (typeof options.declaredLength === "number") request.headers.set("content-length", String(options.declaredLength));
  return request;
}

beforeEach(() => {
  mocks.authorized = true;
  mocks.productExists = true;
  mocks.committedRow = null;
  mocks.uploadImage.mockReset();
  mocks.uploadImage.mockResolvedValue(asset);
  mocks.commitProductImage.mockReset();
  mocks.commitProductImage.mockResolvedValue({ status: "ok", message: "Image added.", images, productId: "p1" });
  mocks.destroyImage.mockReset();
  mocks.destroyImage.mockResolvedValue({ ok: true });
  mocks.revalidateImagePaths.mockReset();
  mocks.revalidateImagePaths.mockResolvedValue(undefined);
});

describe("image upload route", () => {
  it("rejects unauthenticated calls before any provider call", async () => {
    mocks.authorized = false;
    const response = await POST(await multipart(jpeg));
    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({ success: false, code: "unauthenticated" });
    expect(mocks.uploadImage).not.toHaveBeenCalled();
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });

  it("rejects cross-origin and missing custom-header requests", async () => {
    const crossOrigin = await POST(await multipart(jpeg, { origin: "https://evil.test" }));
    expect(crossOrigin.status).toBe(403);
    expect(mocks.uploadImage).not.toHaveBeenCalled();

    const noHeader = await POST(await multipart(jpeg, { header: null }));
    expect(noHeader.status).toBe(403);
    expect(mocks.uploadImage).not.toHaveBeenCalled();
  });

  it("accepts exactly 4,000,000 file bytes", async () => {
    const response = await POST(await multipart(pad(jpeg, 4_000_000)));
    expect(response.status).toBe(201);
    expect(mocks.uploadImage).toHaveBeenCalledTimes(1);
    expect(mocks.uploadImage.mock.calls[0]?.[0]).toHaveLength(4_000_000);
  });

  it("rejects 4,000,001 file bytes before provider forwarding", async () => {
    const response = await POST(await multipart(pad(jpeg, 4_000_001)));
    expect(response.status).toBe(413);
    expect(await response.json()).toMatchObject({ code: "too_large", message: "Each image must be 4 MB (4,000,000 bytes) or smaller." });
    expect(mocks.uploadImage).not.toHaveBeenCalled();
  });

  it("counts streamed bytes when Content-Length is missing or false", async () => {
    const missing = await POST(await multipart(jpeg, { declaredLength: null }));
    expect(missing.status).toBe(201);

    const falseLength = await POST(await multipart(pad(jpeg, 4_000_001), { declaredLength: 50 }));
    expect(falseLength.status).toBe(413);
    expect(mocks.uploadImage).toHaveBeenCalledTimes(1);
  });

  it("caps the whole multipart body, including overhead", async () => {
    const response = await POST(await multipart(pad(jpeg, 4_000_000), { extra: { padding: "x".repeat(40_000) } }));
    expect(response.status).toBe(413);
    expect(mocks.uploadImage).not.toHaveBeenCalled();
  });

  it("rejects forged signatures and mismatched MIME types", async () => {
    const forged = await POST(await multipart(new TextEncoder().encode("not an image"), { type: "image/jpeg" }));
    expect(forged.status).toBe(415);
    expect(mocks.uploadImage).not.toHaveBeenCalled();

    const mismatch = await POST(await multipart(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), { type: "image/jpeg" }));
    expect(mismatch.status).toBe(415);
    expect(mocks.uploadImage).not.toHaveBeenCalled();
  });

  it("rejects duplicate or unknown multipart fields", async () => {
    const duplicate = await multipart(jpeg, { extra: { productId: "p2" } });
    expect((await POST(duplicate)).status).toBe(400);
    expect(mocks.uploadImage).not.toHaveBeenCalled();
  });

  it("returns only the trusted provider result and keeps it after commit", async () => {
    const response = await POST(await multipart(jpeg));
    const body = await response.json();
    expect(body).toMatchObject({ success: true, message: "Image added.", images });
    expect(mocks.commitProductImage).toHaveBeenCalledWith({ productId: "p1", asset });
    expect(mocks.destroyImage).not.toHaveBeenCalled();
  });

  it("cleans the upload up when the database rejects it", async () => {
    mocks.commitProductImage.mockResolvedValue({ status: "limit_reached", message: "A product can have at most 8 images." });
    const response = await POST(await multipart(jpeg));
    expect(response.status).toBe(409);
    expect(mocks.destroyImage).toHaveBeenCalledWith(asset.publicId);
  });

  it("cleans up a rollback but never a confirmed commit", async () => {
    mocks.commitProductImage.mockRejectedValue(new Error("transaction failed"));
    const rollback = await POST(await multipart(jpeg));
    expect(rollback.status).toBe(503);
    expect(mocks.destroyImage).toHaveBeenCalledTimes(1);

    mocks.committedRow = { id: "i1" };
    const ambiguous = await POST(await multipart(jpeg));
    expect(ambiguous.status).toBe(503);
    expect(mocks.destroyImage).toHaveBeenCalledTimes(1);
  });

  it("saves nothing when the provider upload fails", async () => {
    mocks.uploadImage.mockRejectedValue(new Error("provider detail must not leak"));
    const response = await POST(await multipart(jpeg));
    const body = await response.json();
    expect(response.status).toBe(502);
    expect(body).toEqual({ success: false, code: "upload_failed", message: "Image upload failed. Please try again." });
    expect(mocks.commitProductImage).not.toHaveBeenCalled();
  });

  it("keeps a committed image when cache revalidation fails", async () => {
    mocks.revalidateImagePaths.mockRejectedValue(new Error("cache down"));
    const response = await POST(await multipart(jpeg));
    expect(response.status).toBe(201);
    expect(mocks.destroyImage).not.toHaveBeenCalled();
  });
});
