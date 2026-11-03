"use server";

import { revalidatePath } from "next/cache";
import { assertAdmin } from "@/lib/admin-auth";
import {
  createCategorySchema,
  renameCategorySchema,
} from "@/lib/admin-category-schema";
import {
  createCategory,
  renameCategory,
  type CategoryMutationResult,
} from "@/lib/admin-categories";

export type AdminCategoryActionResult =
  | { success: true; message: string; id?: string }
  | { success: false; message: string };

const unauthorizedResult: AdminCategoryActionResult = {
  success: false,
  message: "Your session expired. Please sign in again.",
};

function revalidateCategoryPaths(): void {
  revalidatePath("/admin/categories");
  revalidatePath("/admin/products");
  revalidatePath("/admin/products/new");
  // Category names surface in storefront navigation.
  revalidatePath("/");
}

function mutationToResult(
  result: CategoryMutationResult,
): AdminCategoryActionResult {
  switch (result.status) {
    case "created":
      revalidateCategoryPaths();
      return { success: true, message: result.message, id: result.id };
    case "renamed":
      revalidateCategoryPaths();
      return { success: true, message: result.message };
    case "not_found":
      return { success: false, message: "That category could not be found." };
    case "name_taken":
      return {
        success: false,
        message: "A category with that name already exists.",
      };
  }
}

export async function createAdminCategory(
  input: unknown,
): Promise<AdminCategoryActionResult> {
  const auth = await assertAdmin();
  if (!auth.authorized) return unauthorizedResult;

  const parsed = createCategorySchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? "Enter a valid name.",
    };
  }

  const result = await createCategory(parsed.data.name);
  return mutationToResult(result);
}

export async function renameAdminCategory(
  input: unknown,
): Promise<AdminCategoryActionResult> {
  const auth = await assertAdmin();
  if (!auth.authorized) return unauthorizedResult;

  const parsed = renameCategorySchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? "Enter a valid name.",
    };
  }

  const result = await renameCategory(parsed.data.id, parsed.data.name);
  return mutationToResult(result);
}
