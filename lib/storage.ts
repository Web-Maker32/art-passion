import "server-only";

import { createHash } from "node:crypto";
import { v2 as cloudinary } from "cloudinary";
import { env } from "@/lib/env";
import {
  MIME_TO_FORMAT,
  UPLOAD_FOLDER,
  type AllowedMimeType,
} from "@/lib/image-upload";

/**
 * Single storage seam for the admin image pipeline. Everything that talks to a
 * binary store lives here so the provider can be swapped later without
 * touching actions or components. This module is server-only: it reads
 * CLOUDINARY_API_SECRET and must never be imported into a client bundle.
 */

export type UploadSignature = {
  /** Absolute Cloudinary endpoint the browser uploads to directly. */
  uploadUrl: string;
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  /** Params the browser must echo back; they are covered by the signature. */
  signedParams: Record<string, string>;
};

export type DestroyResult =
  | { ok: true }
  | { ok: false; error: string };

export interface StorageProvider {
  signImageUpload(input: { mimeType: AllowedMimeType }): UploadSignature;
  destroyImage(publicId: string): Promise<DestroyResult>;
}

/**
 * Cloudinary signature: sort the upload params, join as key=value with "&",
 * append the API secret, then take the SHA-1 hex digest. Params with empty or
 * nullish values are excluded, matching Cloudinary's own algorithm.
 */
export function buildCloudinarySignature(
  params: Record<string, string | number | boolean | undefined | null>,
  apiSecret: string,
): string {
  const encoded = Object.keys(params)
    .filter((key) => {
      const value = params[key];
      return value !== undefined && value !== null && value !== "";
    })
    .sort()
    .map((key) => {
      const value = params[key];
      const normalized =
        typeof value === "boolean" ? (value ? "1" : "0") : String(value);
      return `${key}=${normalized}`;
    })
    .join("&");

  return createHash("sha1").update(`${encoded}${apiSecret}`).digest("hex");
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
  signImageUpload({ mimeType }) {
    const timestamp = Math.floor(Date.now() / 1000);
    const folder = UPLOAD_FOLDER;
    const allowedFormats = MIME_TO_FORMAT[mimeType];

    // folder + allowed_formats + timestamp are signed, so the browser cannot
    // change the destination folder or upload a disallowed format.
    const signature = buildCloudinarySignature(
      { folder, allowed_formats: allowedFormats, timestamp },
      env.CLOUDINARY_API_SECRET,
    );

    return {
      uploadUrl: `https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/image/upload`,
      cloudName: env.CLOUDINARY_CLOUD_NAME,
      apiKey: env.CLOUDINARY_API_KEY,
      timestamp,
      signature,
      signedParams: { folder, allowed_formats: allowedFormats },
    };
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
