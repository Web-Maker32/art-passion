"use server";

import { revalidatePath } from "next/cache";
import { assertAdmin } from "@/lib/admin-auth";
import {
  productFormSchema,
  productIdSchema,
  quickStockSchema,
} from "@/lib/admin-product-schema";
import {
  deleteProduct,
  duplicateProduct,
  saveProduct,
  setProductArchived,
  updateVariantStock,
  type AdminProductDeleteResult,
  type AdminProductMutationResult,
} from "@/lib/admin-products";

export type AdminProductActionResult =
  | {
      success: true;
      message: string;
      productId?: string;
    }
  | {
      success: false;
      message: string;
      fieldErrors?: Record<string, string>;
    };

const unauthorizedResult: AdminProductActionResult = {
  success: false,
  message: "Your session expired. Please sign in again.",
};

function revalidateProductPaths(productId?: string): void {
  revalidatePath("/admin/products");
  revalidatePath("/admin");
  if (productId) {
    revalidatePath(`/admin/products/${productId}`);
  }
}

function mapZodIssues(error: {
  issues: ReadonlyArray<{ path: ReadonlyArray<PropertyKey>; message: string }>;
}): AdminProductActionResult {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path
      .map((segment) => String(segment))
      .join(".")
      .replace(/\.\d+\./g, ".");
    if (key && !fieldErrors[key]) {
      fieldErrors[key] = issue.message;
    }
  }
  return {
    success: false,
    message: "Check the highlighted fields and try again.",
    fieldErrors,
  };
}

function mutationToResult(
  result: AdminProductMutationResult,
): AdminProductActionResult {
  switch (result.status) {
    case "saved":
      revalidateProductPaths(result.productId);
      return {
        success: true,
        message: result.message,
        productId: result.productId,
      };
    case "not_found":
      return { success: false, message: "That product could not be found." };
    case "slug_taken":
      return {
        success: false,
        message: "Check the highlighted fields and try again.",
        fieldErrors: { slug: "This slug is already used by another product." },
      };
    case "sku_taken":
      return {
        success: false,
        message: "Check the highlighted fields and try again.",
        fieldErrors: {
          variants: "A SKU is already used by another product's variant.",
        },
      };
    case "publish_blocked":
    case "variant_ordered":
      return { success: false, message: result.message };
  }
}

export async function saveAdminProduct(
  input: unknown,
  productId?: string,
): Promise<AdminProductActionResult> {
  const auth = await assertAdmin();
  if (!auth.authorized) return unauthorizedResult;

  const parsed = productFormSchema.safeParse(input);
  if (!parsed.success) return mapZodIssues(parsed.error);

  const parsedId = productIdSchema.shape.productId.optional().safeParse(productId);
  if (!parsedId.success) return { success: false, message: "Unknown product." };
  const result = await saveProduct(parsed.data, parsedId.data);
  return mutationToResult(result);
}

export async function archiveAdminProduct(
  input: unknown,
): Promise<AdminProductActionResult> {
  const auth = await assertAdmin();
  if (!auth.authorized) return unauthorizedResult;

  const parsed = productIdSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: "Unknown product." };
  }

  const result = await setProductArchived(parsed.data.productId, true);
  if (result.status === "not_found") {
    return { success: false, message: "That product could not be found." };
  }

  revalidateProductPaths(parsed.data.productId);
  return { success: true, message: "Product archived (hidden from the store)." };
}

export async function restoreAdminProduct(
  input: unknown,
): Promise<AdminProductActionResult> {
  const auth = await assertAdmin();
  if (!auth.authorized) return unauthorizedResult;

  const parsed = productIdSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: "Unknown product." };
  }

  const result = await setProductArchived(parsed.data.productId, false);
  if (result.status === "not_found") {
    return { success: false, message: "That product could not be found." };
  }

  revalidateProductPaths(parsed.data.productId);
  return { success: true, message: "Product restored and published." };
}

function deleteToResult(
  result: AdminProductDeleteResult,
  productId: string,
): AdminProductActionResult {
  switch (result.status) {
    case "deleted":
      revalidateProductPaths();
      return { success: true, message: result.message, productId };
    case "not_found":
      return { success: false, message: "That product could not be found." };
    case "ordered":
      return {
        success: false,
        message:
          "This product appears in past orders and cannot be deleted. Archive it instead.",
      };
  }
}

export async function deleteAdminProduct(
  input: unknown,
): Promise<AdminProductActionResult> {
  const auth = await assertAdmin();
  if (!auth.authorized) return unauthorizedResult;

  const parsed = productIdSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: "Unknown product." };
  }

  const result = await deleteProduct(parsed.data.productId);
  return deleteToResult(result, parsed.data.productId);
}

export async function duplicateAdminProduct(
  input: unknown,
): Promise<AdminProductActionResult> {
  const auth = await assertAdmin();
  if (!auth.authorized) return unauthorizedResult;

  const parsed = productIdSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: "Unknown product." };
  }

  const result = await duplicateProduct(parsed.data.productId);
  return mutationToResult(result);
}

export async function updateAdminVariantStock(
  input: unknown,
): Promise<AdminProductActionResult> {
  const auth = await assertAdmin();
  if (!auth.authorized) return unauthorizedResult;

  const parsed = quickStockSchema.safeParse(input);
  if (!parsed.success) {
    const mapped = mapZodIssues(parsed.error);
    const stockError = mapped.success
      ? undefined
      : mapped.fieldErrors?.["stock"];
    return { success: false, message: stockError ?? mapped.message };
  }

  const result = await updateVariantStock(
    parsed.data.variantId,
    parsed.data.stock,
  );
  if (result.status === "not_found") {
    return { success: false, message: "That variant could not be found." };
  }

  revalidateProductPaths();
  return { success: true, message: "Stock updated." };
}
