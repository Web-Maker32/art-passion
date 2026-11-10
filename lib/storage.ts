import "server-only";

import { randomUUID } from "node:crypto";
import { z } from "zod";
import { logger } from "@/lib/logger";
import { v2 as cloudinary } from "cloudinary";
import { env } from "@/lib/env";
import {
  MIME_TO_FORMAT,
  MAX_FILE_BYTES,
  detectImageMime,
  UPLOAD_FOLDER,
  type AllowedMimeType,
} from "@/lib/image-upload";

/**
 * Single storage seam for the admin image pipeline. Everything that talks to a
 * binary store lives here so the provider can be swapped later without
 * touching actions or components. This module is server-only: it reads
 * CLOUDINARY_API_SECRET and must never be imported into a client bundle.
 */

const verifiedAsset = Symbol("verified-image-asset");
export type VerifiedImageAsset = {
  publicId: string;
  url: string;
  bytes: number;
  format: string;
  readonly [verifiedAsset]: true;
};

const assetResponseSchema = z.object({
  public_id: z.string().min(1).max(256),
  secure_url: z.string().url().max(2048),
  resource_type: z.literal("image"),
  format: z.enum(["jpg", "png", "webp"]),
  bytes: z.number().int().positive().max(MAX_FILE_BYTES),
});

export type DestroyResult =
  | { ok: true }
  | { ok: false; error: string };

export interface StorageProvider {
  uploadImage(bytes: Uint8Array, mimeType: AllowedMimeType): Promise<VerifiedImageAsset>;
  destroyImage(publicId: string): Promise<DestroyResult>;
}

let configured = false;
function ensureConfigured(): void {
  if (configured) return;
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  configured = true;
}

export const cloudinaryProvider: StorageProvider = {
  async uploadImage(bytes, mimeType) {
    if (!bytes.length || bytes.length > MAX_FILE_BYTES || detectImageMime(bytes) !== mimeType) {
      throw new Error("Invalid image.");
    }
    ensureConfigured();
    const id = randomUUID();
    const publicId = `${UPLOAD_FOLDER}/${id}`;
    const uploaded: unknown = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream({
        folder: UPLOAD_FOLDER, public_id: id, resource_type: "image",
        allowed_formats: ["jpg", "png", "webp"], overwrite: false,
        use_filename: false, unique_filename: false, timeout: 30_000,
      }, (error, result) => error ? reject(new Error("Image upload failed.")) : resolve(result));
      stream.on("error", () => reject(new Error("Image upload failed.")));
      stream.end(Buffer.from(bytes));
    });
    const parsed = assetResponseSchema.safeParse(uploaded);
    if (parsed.success) {
      const asset = parsed.data;
      const url = new URL(asset.secure_url);
      const path = `/${env.CLOUDINARY_CLOUD_NAME}/image/upload/`;
      const deliveryPath = decodeURIComponent(url.pathname.slice(path.length)).replace(/^v\d+\//, "");
      if (asset.public_id === publicId && asset.bytes === bytes.length && asset.format === MIME_TO_FORMAT[mimeType] &&
        url.protocol === "https:" && url.hostname === "res.cloudinary.com" && !url.port && !url.username && !url.password &&
        !url.search && !url.hash && url.pathname.startsWith(path) && deliveryPath === `${publicId}.${asset.format}`) {
        return { publicId, url: asset.secure_url, bytes: asset.bytes, format: asset.format, [verifiedAsset]: true };
      }
    }
    // Only the server-generated ID is eligible for cleanup; never trust a returned ID.
    const cleaned = await cloudinaryProvider.destroyImage(publicId);
    if (!cleaned.ok) logger.warn("upload_cleanup_failed");
    throw new Error("Image upload could not be verified.");
  },

  async destroyImage(publicId) {
    try {
      ensureConfigured();
      const result = await cloudinary.uploader.destroy(publicId);
      // Cloudinary returns { result: "ok" | "not found" }.
      if (result?.result === "ok" || result?.result === "not found") {
        return { ok: true };
      }
      return {
        ok: false,
        error: "Cloudinary could not confirm deletion. The image was kept.",
      };
    } catch {
      // Never leak provider/secret details to the client.
      return {
        ok: false,
        error: "Cloudinary could not confirm deletion. The image was kept.",
      };
    }
  },
};

/** The active storage provider. Swap this binding to change providers. */
export const storage: StorageProvider = cloudinaryProvider;
