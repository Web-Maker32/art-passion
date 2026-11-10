"use server";

import { assertAdmin } from "@/lib/admin-auth";
import { revalidateImagePaths } from "@/lib/revalidate-product-images";
import {
  imageAltSchema,
  imageIdSchema,
  moveImageSchema,
  type ProductImageItem,
} from "@/lib/image-upload";
import {
  deleteImage,
  moveImage,
  setPrimaryImage,
  updateImageAlt,
  type ImageMutationResult,
} from "@/lib/product-images";

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
