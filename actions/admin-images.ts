"use server";

import { revalidatePath } from "next/cache";
import { assertAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import { storage } from "@/lib/storage";
import {
  commitImageSchema,
  imageAltSchema,
  imageIdSchema,
  MAX_IMAGES_PER_PRODUCT,
  moveImageSchema,
  signatureRequestSchema,
  type ProductImageItem,
} from "@/lib/image-upload";
import {
  commitProductImage,
  countProductImages,
  deleteImage,
  moveImage,
  setPrimaryImage,
  updateImageAlt,
  type ImageMutationResult,
} from "@/lib/product-images";

/** Client-safe upload signature payload (mirrors lib/storage UploadSignature). */
export type UploadSignaturePayload = {
  uploadUrl: string;
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  signedParams: Record<string, string>;
};

export type UploadSignatureResult =
  | { success: true; upload: UploadSignaturePayload }
  | { success: false; message: string };

export type ImageActionResult =
  | { success: true; message: string; images: ProductImageItem[] }
  | { success: false; message: string };

const unauthorizedResult = {
  success: false,
  message: "Your session expired. Please sign in again.",
} as const;

function firstIssueMessage(error: {
  issues: Array<{ message: string }>;
}): string {
  return error.issues[0]?.message ?? "Invalid request.";
}

async function revalidateImagePaths(productId: string): Promise<void> {
  revalidatePath(`/admin/products/${productId}`);
  revalidatePath("/admin/products");
  revalidatePath("/");
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { slug: true },
  });
  if (product) {
    revalidatePath(`/products/${product.slug}`);
  }
}

function toActionResult(result: ImageMutationResult): ImageActionResult {
  if (result.status === "ok") {
    return {
      success: true,
      message: result.message,
      images: result.images,
    };
  }
  return { success: false, message: result.message };
}

/**
 * Admin-only: returns a Cloudinary signature so the browser can upload a file
 * directly to Cloudinary. Refuses without a session, and refuses bad file types
 * or oversized files via the Zod schema before any signature is produced.
 */
export async function createImageUploadSignature(
  input: unknown,
): Promise<UploadSignatureResult> {
  const auth = await assertAdmin();
  if (!auth.authorized) return unauthorizedResult;

  const parsed = signatureRequestSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: firstIssueMessage(parsed.error) };
  }

  const product = await prisma.product.findUnique({
    where: { id: parsed.data.productId },
    select: { id: true },
  });
  if (!product) {
    return { success: false, message: "That product could not be found." };
  }

  const count = await countProductImages(parsed.data.productId);
  if (count >= MAX_IMAGES_PER_PRODUCT) {
    return {
      success: false,
      message: `A product can have at most ${MAX_IMAGES_PER_PRODUCT} images.`,
    };
  }

  const upload = storage.signImageUpload({ mimeType: parsed.data.mimeType });
  return { success: true, upload };
}

export async function saveProductImage(
  input: unknown,
): Promise<ImageActionResult> {
  const auth = await assertAdmin();
  if (!auth.authorized) return unauthorizedResult;

  const parsed = commitImageSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: firstIssueMessage(parsed.error) };
  }

  const result = await commitProductImage(parsed.data);
  if (result.status === "ok") {
    await revalidateImagePaths(result.productId);
  }
  return toActionResult(result);
}

export async function setPrimaryProductImage(
  input: unknown,
): Promise<ImageActionResult> {
  const auth = await assertAdmin();
  if (!auth.authorized) return unauthorizedResult;

  const parsed = imageIdSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: firstIssueMessage(parsed.error) };
  }

  const result = await setPrimaryImage(parsed.data.imageId);
  if (result.status === "ok") {
    await revalidateImagePaths(result.productId);
  }
  return toActionResult(result);
}

export async function moveProductImage(
  input: unknown,
): Promise<ImageActionResult> {
  const auth = await assertAdmin();
  if (!auth.authorized) return unauthorizedResult;

  const parsed = moveImageSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: firstIssueMessage(parsed.error) };
  }

  const result = await moveImage(parsed.data.imageId, parsed.data.direction);
  if (result.status === "ok") {
    await revalidateImagePaths(result.productId);
  }
  return toActionResult(result);
}

export async function updateProductImageAlt(
  input: unknown,
): Promise<ImageActionResult> {
  const auth = await assertAdmin();
  if (!auth.authorized) return unauthorizedResult;

  const parsed = imageAltSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: firstIssueMessage(parsed.error) };
  }

  const result = await updateImageAlt(parsed.data.imageId, parsed.data.alt);
  if (result.status === "ok") {
    await revalidateImagePaths(result.productId);
  }
  return toActionResult(result);
}

export async function deleteProductImage(
  input: unknown,
): Promise<ImageActionResult> {
  const auth = await assertAdmin();
  if (!auth.authorized) return unauthorizedResult;

  const parsed = imageIdSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: firstIssueMessage(parsed.error) };
  }

  const result = await deleteImage(parsed.data.imageId);
  if (result.status === "ok") {
    await revalidateImagePaths(result.productId);
  }
  return toActionResult(result);
}
