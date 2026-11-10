import { describe, expect, it } from "vitest";
import {
  detectImageMime,
  IMAGE_SIZE_MESSAGE,
  MAX_FILE_BYTES,
  uploadProductSchema,
  validateImageFile,
} from "@/lib/image-upload";

const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]);
const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const webp = new Uint8Array([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]);

describe("validateImageFile (client guard)", () => {
  it("accepts JPEG, PNG and WebP within the size limit", () => {
    expect(validateImageFile("image/jpeg", 1024)).toBeNull();
    expect(validateImageFile("image/png", MAX_FILE_BYTES)).toBeNull();
    expect(validateImageFile("image/webp", 2048)).toBeNull();
  });

  it("rejects any other MIME type", () => {
    expect(validateImageFile("image/gif", 1024)).toMatch(/JPEG, PNG and WebP/i);
    expect(validateImageFile("application/pdf", 1024)).toMatch(/JPEG, PNG and WebP/i);
  });

  it("rejects empty and oversized files using the 4,000,000-byte message", () => {
    expect(validateImageFile("image/png", 0)).toMatch(/empty/i);
    expect(validateImageFile("image/png", MAX_FILE_BYTES + 1)).toBe(IMAGE_SIZE_MESSAGE);
    expect(MAX_FILE_BYTES).toBe(4_000_000);
  });
});

describe("detectImageMime", () => {
  it("identifies genuine JPEG, PNG and RIFF/WebP signatures", () => {
    expect(detectImageMime(jpeg)).toBe("image/jpeg");
    expect(detectImageMime(png)).toBe("image/png");
    expect(detectImageMime(webp)).toBe("image/webp");
  });

  it("rejects forged, truncated and non-image bytes", () => {
    expect(detectImageMime(new Uint8Array())).toBeNull();
    expect(detectImageMime(new Uint8Array([0xff, 0xd8]))).toBeNull();
    expect(detectImageMime(png.slice(0, 5))).toBeNull();
    expect(detectImageMime(new TextEncoder().encode("GIF89a"))).toBeNull();
    expect(detectImageMime(new TextEncoder().encode("<svg></svg>"))).toBeNull();
  });
});

describe("uploadProductSchema", () => {
  it("accepts a bounded product id and rejects duplicates or unknown fields", () => {
    expect(uploadProductSchema.safeParse({ productId: "p1" }).success).toBe(true);
    expect(uploadProductSchema.safeParse({ productId: "" }).success).toBe(false);
    expect(uploadProductSchema.safeParse({ productId: "x".repeat(129) }).success).toBe(false);
    expect(uploadProductSchema.safeParse({ productId: "p1", extra: "1" }).success).toBe(false);
  });
});
