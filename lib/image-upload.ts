import { z } from "zod";

/**
 * Isomorphic upload limits and Zod schemas for admin product images. This
 * module has NO "server-only" guard and NO secrets so the browser can enforce
 * the same limits the server does. Signing/destroy live in lib/storage.ts.
 */

export const UPLOAD_FOLDER = "art-passion/products";
export const MAX_IMAGES_PER_PRODUCT = 8;
export const MAX_FILE_BYTES = 4_000_000;
export const MAX_UPLOAD_BODY_BYTES = 4_032_768;
export const IMAGE_SIZE_MESSAGE = "Each image must be 4 MB (4,000,000 bytes) or smaller.";

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

export const uploadProductSchema = z.object({
  productId: z.string().min(1, "Unknown product.").max(128),
}).strict();

export type ImageUploadResult =
  | { success: true; message: string; images: ProductImageItem[] }
  | { success: false; code: string; message: string };

export function detectImageMime(bytes: Uint8Array): AllowedMimeType | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  const png = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (bytes.length >= 8 && png.every((byte, index) => bytes[index] === byte)) return "image/png";
  if (bytes.length >= 12 && bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) return "image/webp";
  return null;
}

export const imageIdSchema = z.object({
  imageId: z.string().min(1, "Unknown image.").max(128),
});

export const imageAltSchema = z.object({
  imageId: z.string().min(1, "Unknown image.").max(128),
  alt: z.string().trim().max(300, "Alt text is too long."),
});

export const moveImageSchema = z.object({
  imageId: z.string().min(1, "Unknown image.").max(128),
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
    return IMAGE_SIZE_MESSAGE;
  }
  return null;
}
