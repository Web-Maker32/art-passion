import "server-only";

import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import {
  slugifyTitle,
  type ProductFormData,
} from "@/lib/admin-product-schema";

/**
 * Server-side product business logic for the admin: create/update with
 * variants, publish rules, archive/restore, guarded delete, quick stock edit
 * and duplicate. The shared Zod schemas live in lib/admin-product-schema.ts so
 * the client form can reuse them. Consumed by actions/admin-products.ts.
 */

// ---------------------------------------------------------------------------
// Result types
// ---------------------------------------------------------------------------

export type AdminProductMutationResult =
  | { status: "saved"; productId: string; message: string }
  | { status: "not_found" }
  | { status: "slug_taken" }
  | { status: "sku_taken" }
  | { status: "publish_blocked"; message: string }
  | { status: "variant_ordered"; message: string };

export type AdminProductDeleteResult =
  | { status: "deleted"; message: string }
  | { status: "not_found" }
  | { status: "ordered" };

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

type NormalizedVariant = {
  id?: string;
  label: string;
  price: number;
  stock: number;
  sku: string | null;
};

function normalizeVariants(
  variants: ProductFormData["variants"],
): NormalizedVariant[] {
  return variants.map((variant) => ({
    ...(variant.variantId ? { id: variant.variantId } : {}),
    label: variant.label,
    price: variant.price,
    stock: variant.stock,
    sku: variant.sku && variant.sku.length > 0 ? variant.sku : null,
  }));
}

/**
 * Publishing rules: at least one variant, and (once images exist) every image
 * needs alt text. Kept here so tests can exercise it without the action layer.
 */
export async function validatePublishRequirements(input: {
  productId?: string;
  variants: NormalizedVariant[];
}): Promise<string | null> {
  if (input.variants.length === 0) {
    return "Add at least one variant before publishing.";
  }
  if (input.productId) {
    const missingAlt = await prisma.productImage.count({
      where: { productId: input.productId, alt: "" },
    });
    if (missingAlt > 0) {
      return "Every image needs alt text before publishing.";
    }
  }
  return null;
}

async function isSlugTaken(slug: string, productId?: string): Promise<boolean> {
  const existing = await prisma.product.findUnique({
    where: { slug },
    select: { id: true },
  });
  return existing !== null && existing.id !== productId;
}

async function findSkuConflict(
  variants: NormalizedVariant[],
  productId?: string,
): Promise<string | null> {
  const skus = variants
    .map((variant) => variant.sku)
    .filter((sku): sku is string => sku !== null);
  if (skus.length === 0) return null;

  // Duplicate SKUs within the same form submission.
  if (new Set(skus).size !== skus.length) return skus[0];

  const conflict = await prisma.variant.findFirst({
    where: {
      sku: { in: skus },
      ...(productId ? { productId: { not: productId } } : {}),
    },
    select: { sku: true },
  });
  return conflict?.sku ?? null;
}

/** Variant ids that appear in at least one order line and must not be removed. */
export async function getOrderedVariantIds(variantIds: string[]): Promise<Set<string>> {
  if (variantIds.length === 0) return new Set();
  const rows = await prisma.orderItem.findMany({
    where: { variantId: { in: variantIds } },
    select: { variantId: true },
    distinct: ["variantId"],
  });
  return new Set(
    rows.map((row) => row.variantId).filter((id): id is string => id !== null),
  );
}

// ---------------------------------------------------------------------------
// Create / update
// ---------------------------------------------------------------------------

function productData(
  data: ProductFormData,
): Prisma.ProductUpdateInput | Prisma.ProductCreateInput {
  return {
    title: data.title,
    slug: data.slug,
    description: data.description,
    type: data.type,
    status: data.status,
    madeToOrder: data.madeToOrder,
    leadTimeDays: data.leadTimeDays,
    materials: data.materials,
    tags: data.tags,
  };
}

export async function saveProduct(
  data: ProductFormData,
  productId?: string,
): Promise<AdminProductMutationResult> {
  const variants = normalizeVariants(data.variants);

  if (data.status === "PUBLISHED") {
    const publishError = await validatePublishRequirements({
      ...(productId ? { productId } : {}),
      variants,
    });
    if (publishError) return { status: "publish_blocked", message: publishError };
  }

  if (await isSlugTaken(data.slug, productId)) {
    return { status: "slug_taken" };
  }

  const skuConflict = await findSkuConflict(variants, productId);
  if (skuConflict) return { status: "sku_taken" };

  try {
    if (!productId) {
      const created = await prisma.product.create({
        data: {
          ...(productData(data) as Prisma.ProductCreateInput),
          category: { connect: { id: data.categoryId } },
          variants: {
            create: variants.map(({ label, price, stock, sku }) => ({
              label,
              price,
              stock,
              ...(sku ? { sku } : {}),
            })),
          },
        },
        select: { id: true },
      });
      return {
        status: "saved",
        productId: created.id,
        message: "Product created.",
      };
    }

    const existing = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, categoryId: true, variants: { select: { id: true } } },
    });
    if (!existing) return { status: "not_found" };

    // Block removal of variants that appear in orders.
    const keptIds = new Set(
      variants.map((variant) => variant.id).filter((id): id is string => !!id),
    );
    const removedIds = existing.variants
      .map((variant) => variant.id)
      .filter((id) => !keptIds.has(id));
    if (removedIds.length > 0) {
      const ordered = await getOrderedVariantIds(removedIds);
      if (ordered.size > 0) {
        return {
          status: "variant_ordered",
          message:
            "A removed variant appears in past orders and cannot be deleted. Set its stock to 0 or hide the product instead.",
        };
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id: productId },
        data: {
          ...(productData(data) as Prisma.ProductUpdateInput),
          category:
            data.categoryId === existing.categoryId
              ? undefined
              : { connect: { id: data.categoryId } },
        },
      });

      for (const variant of variants) {
        if (variant.id) {
          await tx.variant.update({
            where: { id: variant.id },
            data: {
              label: variant.label,
              price: variant.price,
              stock: variant.stock,
              sku: variant.sku,
            },
          });
        } else {
          await tx.variant.create({
            data: {
              productId,
              label: variant.label,
              price: variant.price,
              stock: variant.stock,
              ...(variant.sku ? { sku: variant.sku } : {}),
            },
          });
        }
      }

      if (removedIds.length > 0) {
        await tx.variant.deleteMany({ where: { id: { in: removedIds } } });
      }
    });

    return { status: "saved", productId, message: "Product saved." };
  } catch (error) {
    // Unique constraint races (slug or sku created between check and write).
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const target = (error.meta?.target as string[] | undefined)?.[0] ?? "";
      return { status: target === "sku" ? "sku_taken" : "slug_taken" };
    }
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Archive / restore
// ---------------------------------------------------------------------------

export async function setProductArchived(
  productId: string,
  archived: boolean,
): Promise<{ status: "changed"; newStatus: "HIDDEN" | "PUBLISHED" } | { status: "not_found" }> {
  const result = await prisma.product.updateMany({
    where: { id: productId },
    data: { status: archived ? "HIDDEN" : "PUBLISHED" },
  });
  if (result.count === 0) return { status: "not_found" };
  return { status: "changed", newStatus: archived ? "HIDDEN" : "PUBLISHED" };
}

// ---------------------------------------------------------------------------
// Delete (hard delete only for never-ordered products)
// ---------------------------------------------------------------------------

export async function deleteProduct(
  productId: string,
): Promise<AdminProductDeleteResult> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, variants: { select: { id: true } } },
  });
  if (!product) return { status: "not_found" };

  const ordered = await getOrderedVariantIds(product.variants.map((v) => v.id));
  if (ordered.size > 0) return { status: "ordered" };

  // CartItem cascades from Variant; images and variants cascade from Product.
  await prisma.product.delete({ where: { id: productId } });
  return { status: "deleted", message: "Product deleted." };
}

// ---------------------------------------------------------------------------
// Quick stock edit
// ---------------------------------------------------------------------------

export async function updateVariantStock(
  variantId: string,
  stock: number,
): Promise<{ status: "updated" } | { status: "not_found" }> {
  const result = await prisma.variant.updateMany({
    where: { id: variantId },
    data: { stock },
  });
  return result.count === 1 ? { status: "updated" } : { status: "not_found" };
}

// ---------------------------------------------------------------------------
// Duplicate (Phase C)
// ---------------------------------------------------------------------------

async function findFreeSlug(base: string): Promise<string> {
  let candidate = base;
  let suffix = 2;
  while (await isSlugTaken(candidate)) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
    if (suffix > 100) return `${base}-${Date.now()}`;
  }
  return candidate;
}

export async function duplicateProduct(
  productId: string,
): Promise<AdminProductMutationResult> {
  const source = await prisma.product.findUnique({
    where: { id: productId },
    select: {
      title: true,
      slug: true,
      description: true,
      categoryId: true,
      type: true,
      madeToOrder: true,
      leadTimeDays: true,
      materials: true,
      tags: true,
      variants: { select: { label: true, price: true, stock: true } },
    },
  });
  if (!source) return { status: "not_found" };

  const title = `${source.title} (copy)`;
  const slug = await findFreeSlug(
    slugifyTitle(title) || `${source.slug}-copy`,
  );

  const created = await prisma.product.create({
    data: {
      title,
      slug,
      description: source.description,
      categoryId: source.categoryId,
      type: source.type,
      status: "DRAFT",
      madeToOrder: source.madeToOrder,
      leadTimeDays: source.leadTimeDays,
      materials: source.materials,
      tags: source.tags,
      variants: {
        create: source.variants.map(({ label, price, stock }) => ({
          label,
          price,
          stock,
        })),
      },
    },
    select: { id: true },
  });

  return {
    status: "saved",
    productId: created.id,
    message: "Duplicate created as a draft.",
  };
}
