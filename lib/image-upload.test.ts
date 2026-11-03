import { describe, expect, it } from "vitest";
import {
  MAX_FILE_BYTES,
  signatureRequestSchema,
  validateImageFile,
} from "@/lib/image-upload";

describe("validateImageFile (client guard)", () => {
  it("accepts JPEG, PNG and WebP within the size limit", () => {
    expect(validateImageFile("image/jpeg", 1024)).toBeNull();
    expect(validateImageFile("image/png", MAX_FILE_BYTES)).toBeNull();
    expect(validateImageFile("image/webp", 2048)).toBeNull();
  });

  it("rejects any other MIME type", () => {
    expect(validateImageFile("image/gif", 1024)).toMatch(/JPEG, PNG and WebP/i);
    expect(validateImageFile("application/pdf", 1024)).toMatch(
      /JPEG, PNG and WebP/i,
    );
  });

  it("rejects empty and oversized files", () => {
    expect(validateImageFile("image/png", 0)).toMatch(/empty/i);
    expect(validateImageFile("image/png", MAX_FILE_BYTES + 1)).toMatch(/5 MB/i);
  });
});

describe("signatureRequestSchema (server guard)", () => {
  it("accepts a valid request", () => {
    expect(
      signatureRequestSchema.safeParse({
        productId: "p1",
        mimeType: "image/jpeg",
        sizeBytes: 1024,
      }).success,
    ).toBe(true);
  });

  it("rejects a disallowed MIME type", () => {
    expect(
      signatureRequestSchema.safeParse({
        productId: "p1",
        mimeType: "image/gif",
        sizeBytes: 1024,
      }).success,
    ).toBe(false);
  });

  it("rejects an oversized or empty file", () => {
    expect(
      signatureRequestSchema.safeParse({
        productId: "p1",
        mimeType: "image/png",
        sizeBytes: MAX_FILE_BYTES + 1,
      }).success,
    ).toBe(false);
    expect(
      signatureRequestSchema.safeParse({
        productId: "p1",
        mimeType: "image/png",
        sizeBytes: 0,
      }).success,
    ).toBe(false);
  });
});
