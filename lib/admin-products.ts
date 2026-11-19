import "server-only";

import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { storage } from "@/lib/storage";
import {
  slugifyTitle,
  type ProductFormData,
} from "@/lib/admin-product-schema";
import {
  getAdminProduct,
  type AdminProductEdit,
} from "@/lib/queries/admin-products";

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
  | { status: "saved"; productId: string; message: string; product?: AdminProductEdit }
  | { status: "not_found" }
  | { status: "slug_taken" }
  | { status: "sku_taken" }
  | { status: "publish_blocked"; message: string }
  | { status: "variant_ordered"; message: string }
  | { status: "stock_conflict"; message: string };

export type AdminProductDeleteResult =
  | { status: "deleted"; message: string }
  | { status: "not_found" }
  | { status: "ordered" };

/**
 * Thrown inside the save transaction when a variant's stock no longer matches
 * the baseline the editor loaded. Rolling the transaction back means nothing is
 * written, so a concurrent order or stock edit is never silently overwritten.
 */
class StockConflictError extends Error {
  constructor() {
    super("Stock changed while you were editing. Reload the page and try again.");
    this.name = "StockConflictError";
  }
}

export const stockConflictMessage =
  "Stock changed while you were editing. Reload the page and try again.";

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

type NormalizedVariant = {
  id?: string;
  label: string;
  price: number;
  stock: number;
  loadedStock?: number;
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
    ...(variant.loadedStock !== undefined
      ? { loadedStock: variant.loadedStock }
      : {}),
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

function emptyToNull(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function productData(
  data: ProductFormData,
): Prisma.ProductUpdateInput | Prisma.ProductCreateInput {
  return {
    title: data.title,
    slug: data.slug,
    description: data.description,
    shortDescription: emptyToNull(data.shortDescription),
    whatsIncluded: data.whatsIncluded ?? [],
    size: emptyToNull(data.size),
    recommendedAge: emptyToNull(data.recommendedAge),
    safetyNote: emptyToNull(data.safetyNote),
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
              // Made-to-order variants never track physical stock.
              stock: data.madeToOrder ? 0 : stock,
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
        product: (await getAdminProduct(created.id)) ?? undefined,
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
          // Never write stock for made-to-order variants, when the field is
          // unchanged from the loaded baseline, or when no baseline was sent.
          const keepStock =
            data.madeToOrder ||
            variant.loadedStock === undefined ||
            variant.stock === variant.loadedStock;
          if (keepStock) {
            await tx.variant.update({
              where: { id: variant.id },
              data: {
                label: variant.label,
                price: variant.price,
                sku: variant.sku,
              },
            });
          } else {
            // Conditional update: only succeeds while the database still holds
            // the baseline the editor loaded. A concurrent order/stock change
            // makes this match zero rows and aborts the whole save.
            const changed = await tx.variant.updateMany({
              where: { id: variant.id, stock: variant.loadedStock },
              data: {
                label: variant.label,
                price: variant.price,
                sku: variant.sku,
                stock: variant.stock,
              },
            });
            if (changed.count !== 1) throw new StockConflictError();
          }
        } else {
          await tx.variant.create({
            data: {
              productId,
              label: variant.label,
              price: variant.price,
              stock: data.madeToOrder ? 0 : variant.stock,
              ...(variant.sku ? { sku: variant.sku } : {}),
            },
          });
        }
      }

      if (removedIds.length > 0) {
        await tx.variant.deleteMany({ where: { id: { in: removedIds } } });
      }
    });

    return {
      status: "saved",
      productId,
      message: "Product saved.",
      product: (await getAdminProduct(productId)) ?? undefined,
    };
  } catch (error) {
    if (error instanceof StockConflictError) {
      return { status: "stock_conflict", message: stockConflictMessage };
    }
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
    select: {
      id: true,
      variants: { select: { id: true } },
      images: { select: { publicId: true } },
    },
  });
  if (!product) return { status: "not_found" };

  const ordered = await getOrderedVariantIds(product.variants.map((v) => v.id));
  if (ordered.size > 0) return { status: "ordered" };

  // Collect remote asset ids BEFORE deleting; images cascade from Product so
  // the rows (and their publicIds) are gone once the delete commits.
  const publicIds = product.images
    .map((image) => image.publicId)
    .filter((id): id is string => Boolean(id));

  // CartItem cascades from Variant; images and variants cascade from Product.
  await prisma.product.delete({ where: { id: productId } });

  // Only after the database delete succeeded do we touch remote storage. If the
  // delete above threw, this never runs and no asset is removed.
  await cleanupRemoteAssets(publicIds);
  return { status: "deleted", message: "Product deleted." };
}

/**
 * Best-effort Cloudinary cleanup after a successful product delete. Each asset
 * is retried once; a persistent failure logs a fixed-message event (no personal
 * data) and never fails the delete.
 */
async function cleanupRemoteAssets(publicIds: string[]): Promise<void> {
  for (const publicId of publicIds) {
    let destroyed = await storage
      .destroyImage(publicId)
      .catch(() => ({ ok: false as const }));
    if (!destroyed.ok) {
      destroyed = await storage
        .destroyImage(publicId)
        .catch(() => ({ ok: false as const }));
    }
    if (!destroyed.ok) logger.warn("product_delete_asset_cleanup_failed");
  }
}

// ---------------------------------------------------------------------------
// Quick stock edit
// ---------------------------------------------------------------------------

export async function updateVariantStock(
  variantId: string,
  stock: number,
  loadedStock: number,
): Promise<
  { status: "updated" } | { status: "not_found" } | { status: "conflict" }
> {
  const variant = await prisma.variant.findUnique({
    where: { id: variantId },
    select: { id: true, product: { select: { madeToOrder: true } } },
  });
  if (!variant) return { status: "not_found" };

  // Made-to-order variants never write stock; an unchanged field is a no-op.
  if (variant.product.madeToOrder || stock === loadedStock) {
    return { status: "updated" };
  }

  // Same conditional logic as the full save: only write while the database
  // still holds the baseline the inline editor loaded.
  const result = await prisma.variant.updateMany({
    where: { id: variantId, stock: loadedStock },
    data: { stock },
  });
  return result.count === 1 ? { status: "updated" } : { status: "conflict" };
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
      shortDescription: true,
      whatsIncluded: true,
      size: true,
      recommendedAge: true,
      safetyNote: true,
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
      shortDescription: source.shortDescription,
      whatsIncluded: source.whatsIncluded,
      size: source.size,
      recommendedAge: source.recommendedAge,
      safetyNote: source.safetyNote,
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
