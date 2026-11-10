import { z } from "zod";

/**
 * Pure, isomorphic Zod schemas and helpers for the admin product form. This
 * module intentionally has NO "server-only" guard and NO Prisma import so the
 * client-side React Hook Form can share the exact schema the server validates
 * against. Server-side business logic lives in lib/admin-products.ts.
 */

export const slugSchema = z
  .string()
  .trim()
  .min(2, "Slug must be at least 2 characters.")
  .max(80, "Slug must be at most 80 characters.")
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Use lowercase letters, numbers and single hyphens (e.g. felt-rose-kit).",
  );

/** Derives a URL-safe slug from a product title. */
export function slugifyTitle(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
}

export const variantInputSchema = z.object({
  // Existing variants carry their database id; new ones omit it. Named
  // variantId because react-hook-form's useFieldArray reserves "id" as its key.
  variantId: z.string().min(1).max(128).optional(),
  label: z.string().trim().min(1, "Variant label is required.").max(80),
  price: z.coerce
    .number({ message: "Price must be a number." })
    .int("Price must be a whole number of rupees.")
    .positive("Price must be greater than zero.")
    .max(10_000_000, "Price looks too large."),
  stock: z.coerce
    .number({ message: "Stock must be a number." })
    .int("Stock must be a whole number.")
    .min(0, "Stock cannot be negative.")
    .max(100_000, "Stock looks too large."),
  sku: z
    .string()
    .trim()
    .max(60, "SKU must be at most 60 characters.")
    .regex(
      /^[A-Za-z0-9][A-Za-z0-9._-]*$/,
      "SKU may contain letters, numbers, dots, underscores and hyphens.",
    )
    .optional()
    .or(z.literal("")),
});

export const productFormSchema = z.object({
  title: z.string().trim().min(2, "Title is required.").max(120),
  slug: slugSchema,
  description: z
    .string()
    .trim()
    .min(10, "Description must be at least 10 characters.")
    .max(5000),
  shortDescription: z
    .string()
    .trim()
    .max(240, "Short description must be at most 240 characters.")
    .optional(),
  whatsIncluded: z
    .array(z.string().trim().min(1).max(80))
    .max(30, "Add at most 30 included items.")
    .optional(),
  size: z.string().trim().max(80, "Size must be at most 80 characters.").optional(),
  recommendedAge: z
    .string()
    .trim()
    .max(80, "Recommended age must be at most 80 characters.")
    .optional(),
  safetyNote: z
    .string()
    .trim()
    .max(500, "Safety note must be at most 500 characters.")
    .optional(),
  categoryId: z.string().min(1, "Choose a category.").max(128),
  type: z.enum(["KIT", "FELT_SET", "GIFT_SET", "HANDMADE", "SUPPLY"], {
    message: "Choose a product type.",
  }),
  status: z.enum(["DRAFT", "PUBLISHED", "HIDDEN"]),
  madeToOrder: z.boolean(),
  leadTimeDays: z.coerce
    .number({ message: "Lead time must be a number." })
    .int("Lead time must be a whole number of days.")
    .min(1, "Lead time must be at least 1 day.")
    .max(365, "Lead time must be at most 365 days."),
  materials: z
    .array(z.string().trim().min(1).max(60))
    .max(20)
    .optional()
    .default([]),
  tags: z
    .array(z.string().trim().min(1).max(40))
    .max(20)
    .optional()
    .default([]),
  variants: z.array(variantInputSchema).max(100),
});

export type ProductFormInput = z.input<typeof productFormSchema>;
export type ProductFormData = z.output<typeof productFormSchema>;

export const quickStockSchema = z.object({
  variantId: z.string().min(1).max(128),
  stock: z.coerce
    .number({ message: "Stock must be a number." })
    .int("Stock must be a whole number.")
    .min(0, "Stock cannot be negative.")
    .max(100_000, "Stock looks too large."),
});

export const productIdSchema = z.object({
  productId: z.string().min(1, "Unknown product.").max(128),
});
