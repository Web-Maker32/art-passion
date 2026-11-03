import { z } from "zod";

/**
 * Isomorphic upload limits and Zod schemas for admin product images. This
 * module has NO "server-only" guard and NO secrets so the browser can enforce
 * the same limits the server does. Signing/destroy live in lib/storage.ts.
 */

export const UPLOAD_FOLDER = "art-passion/products";
export const MAX_IMAGES_PER_PRODUCT = 8;
export const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB

export const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

/** Maps a validated MIME type to the Cloudinary allowed_formats extension. */
export const MIME_TO_FORMAT: Record<AllowedMimeType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/**
 * Client-safe shape of a stored product image, shared by the server actions and
 * the admin image manager so neither needs a server-only import for the type.
 */
export type ProductImageItem = {
  id: string;
  url: string;
  alt: string;
  position: number;
  isPrimary: boolean;
  publicId: string | null;
};

export const signatureRequestSchema = z.object({
  productId: z.string().min(1, "Unknown product."),
  mimeType: z.enum(ALLOWED_MIME_TYPES, {
    message: "Only JPEG, PNG and WebP images are allowed.",
  }),
  sizeBytes: z
    .number({ message: "File size is required." })
    .int()
    .positive("File is empty.")
    .max(MAX_FILE_BYTES, "Each image must be 5 MB or smaller."),
});

export const commitImageSchema = z.object({
  productId: z.string().min(1, "Unknown product."),
  publicId: z.string().min(1, "Missing Cloudinary id."),
  url: z.string().url("Missing image URL."),
  alt: z.string().trim().max(300, "Alt text is too long.").optional().default(""),
});

export const imageIdSchema = z.object({
  imageId: z.string().min(1, "Unknown image."),
});

export const imageAltSchema = z.object({
  imageId: z.string().min(1, "Unknown image."),
  alt: z.string().trim().max(300, "Alt text is too long."),
});

export const moveImageSchema = z.object({
  imageId: z.string().min(1, "Unknown image."),
  direction: z.enum(["up", "down"]),
});

/**
 * Pure client-side file guard mirroring the server limits. Returns a
 * human-readable reason, or null when the file is acceptable.
 */
export function validateImageFile(
  type: string,
  sizeBytes: number,
): string | null {
  if (!(ALLOWED_MIME_TYPES as readonly string[]).includes(type)) {
    return "Only JPEG, PNG and WebP images are allowed.";
  }
  if (sizeBytes <= 0) {
    return "That file is empty.";
  }
  if (sizeBytes > MAX_FILE_BYTES) {
    return "Each image must be 5 MB or smaller.";
  }
  return null;
}
