import { z } from "zod";

/**
 * Isomorphic Zod schemas for admin category management (create + rename).
 * Renaming changes only the display name; the slug (used in storefront URLs)
 * stays stable so existing links and product relations keep working.
 */

const categoryNameSchema = z
  .string()
  .trim()
  .min(2, "Name must be at least 2 characters.")
  .max(60, "Name must be at most 60 characters.");

export const createCategorySchema = z.object({
  name: categoryNameSchema,
});

export const renameCategorySchema = z.object({
  id: z.string().min(1, "Unknown category.").max(128),
  name: categoryNameSchema,
});

/**
 * Row shape shared by the server query and the client manager. Defined here
 * (isomorphic) so the client component never imports from the server-only
 * lib/admin-categories.ts module.
 */
export type AdminCategoryRow = {
  id: string;
  name: string;
  slug: string;
  productCount: number;
};
