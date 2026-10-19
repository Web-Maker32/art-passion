import { z } from "zod";

const optionalPrice = z.preprocess(
  (value) => (value === "" || value === undefined ? undefined : value),
  z.coerce.number().int().min(0).max(100_000_000).optional(),
);

export const productFilterSchema = z
  .object({
    category: z.string().trim().max(100).optional(),
    type: z
      .enum(["KIT", "FELT_SET", "GIFT_SET", "HANDMADE", "SUPPLY"])
      .optional(),
    minPrice: optionalPrice,
    maxPrice: optionalPrice,
    inStock: z
      .enum(["true", "false"])
      .optional()
      .transform((value) => value === "true"),
    sort: z.enum(["newest", "price-asc", "price-desc"]).default("newest"),
    page: z.coerce.number().int().min(1).default(1),
  })
  .superRefine((filters, context) => {
    if (
      filters.minPrice !== undefined &&
      filters.maxPrice !== undefined &&
      filters.minPrice > filters.maxPrice
    ) {
      context.addIssue({
        code: "custom",
        message: "Minimum price cannot exceed maximum price.",
        path: ["minPrice"],
      });
    }
  });

export type ProductFilters = z.infer<typeof productFilterSchema>;

export type SearchParamsRecord = Record<
  string,
  string | string[] | undefined
>;

export function parseProductFilters(
  params: SearchParamsRecord,
): ProductFilters {
  const firstValues = Object.fromEntries(
    Object.entries(params).map(([key, value]) => [
      key,
      Array.isArray(value) ? value[0] : value,
    ]),
  );

  const result = productFilterSchema.safeParse(firstValues);

  return result.success
    ? result.data
    : productFilterSchema.parse({});
}
