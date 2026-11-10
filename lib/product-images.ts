import "server-only";

import { prisma } from "@/lib/db";
import { storage, type VerifiedImageAsset } from "@/lib/storage";
import {
  MAX_IMAGES_PER_PRODUCT,
  type ProductImageItem,
} from "@/lib/image-upload";

/**
 * Server-side ProductImage persistence for the admin image manager. Ordering
 * uses `position`; the leading image is also flagged with `isPrimary`. Deleting
 * removes the asset from storage first and only drops the row on success, so a
 * storage failure never orphans a broken reference.
 */

export type ProductImageRow = ProductImageItem;

export type ImageMutationResult =
  | { status: "ok"; message: string; images: ProductImageRow[]; productId: string }
  | { status: "not_found"; message: string }
  | { status: "limit_reached"; message: string }
  | { status: "storage_error"; message: string }
  | { status: "conflict"; message: string };

const imageSelect = {
  id: true,
  url: true,
  alt: true,
  position: true,
  isPrimary: true,
  publicId: true,
};

export async function listProductImages(
  productId: string,
): Promise<ProductImageRow[]> {
  return prisma.productImage.findMany({
    where: { productId },
    orderBy: [{ isPrimary: "desc" }, { position: "asc" }],
    select: imageSelect,
  });
}

export async function countProductImages(productId: string): Promise<number> {
  return prisma.productImage.count({ where: { productId } });
}

export async function commitProductImage(input: {
  productId: string;
  asset: VerifiedImageAsset;
}): Promise<ImageMutationResult> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await prisma.$transaction(async (tx): Promise<ImageMutationResult> => {
        const product = await tx.product.findUnique({ where: { id: input.productId }, select: { id: true } });
        if (!product) return { status: "not_found", message: "That product could not be found." };
        const count = await tx.productImage.count({ where: { productId: input.productId } });
        if (count >= MAX_IMAGES_PER_PRODUCT) {
          return { status: "limit_reached", message: `A product can have at most ${MAX_IMAGES_PER_PRODUCT} images.` };
        }
        const last = await tx.productImage.findFirst({
          where: { productId: input.productId }, orderBy: { position: "desc" }, select: { position: true },
        });
        await tx.productImage.create({ data: {
          productId: input.productId, publicId: input.asset.publicId, url: input.asset.url,
          alt: "", position: last ? last.position + 1 : 0, isPrimary: count === 0,
        } });
        const images = await tx.productImage.findMany({
          where: { productId: input.productId }, orderBy: [{ isPrimary: "desc" }, { position: "asc" }], select: imageSelect,
        });
        return { status: "ok", message: "Image added.", images, productId: input.productId };
      }, { isolationLevel: "Serializable", maxWait: 5000, timeout: 5000 });
    } catch (error) {
      if (!error || typeof error !== "object" || !("code" in error) || error.code !== "P2034") throw error;
    }
  }
  return { status: "conflict", message: "Images changed while saving. Please try again." };
}

export async function setPrimaryImage(
  imageId: string,
): Promise<ImageMutationResult> {
  const image = await prisma.productImage.findUnique({
    where: { id: imageId },
    select: { id: true, productId: true },
  });
  if (!image) {
    return { status: "not_found", message: "That image could not be found." };
  }

  await prisma.$transaction([
    prisma.productImage.updateMany({
      where: { productId: image.productId },
      data: { isPrimary: false },
    }),
    prisma.productImage.update({
      where: { id: imageId },
      data: { isPrimary: true },
    }),
  ]);

  const images = await listProductImages(image.productId);
  return {
    status: "ok",
    message: "Primary image updated.",
    images,
    productId: image.productId,
  };
}

/**
 * Reorders by swapping `position` with the neighbour in the given direction.
 * Keyboard-accessible up/down buttons in the UI call this.
 */
export async function moveImage(
  imageId: string,
  direction: "up" | "down",
): Promise<ImageMutationResult> {
  const image = await prisma.productImage.findUnique({
    where: { id: imageId },
    select: { id: true, productId: true, position: true },
  });
  if (!image) {
    return { status: "not_found", message: "That image could not be found." };
  }

  const siblings = await prisma.productImage.findMany({
    where: { productId: image.productId },
    orderBy: { position: "asc" },
    select: { id: true, position: true },
  });

  const index = siblings.findIndex((row) => row.id === imageId);
  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (index < 0 || swapIndex < 0 || swapIndex >= siblings.length) {
    // Already at the boundary; nothing to change.
    const images = await listProductImages(image.productId);
    return {
      status: "ok",
      message: "Order unchanged.",
      images,
      productId: image.productId,
    };
  }

  const target = siblings[swapIndex]!;
  await prisma.$transaction([
    prisma.productImage.update({
      where: { id: image.id },
      data: { position: target.position },
    }),
    prisma.productImage.update({
      where: { id: target.id },
      data: { position: image.position },
    }),
  ]);

  const images = await listProductImages(image.productId);
  return {
    status: "ok",
    message: "Order updated.",
    images,
    productId: image.productId,
  };
}

export async function updateImageAlt(
  imageId: string,
  alt: string,
): Promise<ImageMutationResult> {
  const image = await prisma.productImage.update({
    where: { id: imageId },
    data: { alt },
    select: { productId: true },
  }).catch(() => null);
  if (!image) {
    return { status: "not_found", message: "That image could not be found." };
  }

  const images = await listProductImages(image.productId);
  return {
    status: "ok",
    message: "Alt text saved.",
    images,
    productId: image.productId,
  };
}

export async function deleteImage(
  imageId: string,
): Promise<ImageMutationResult> {
  const image = await prisma.productImage.findUnique({
    where: { id: imageId },
    select: { id: true, productId: true, publicId: true, isPrimary: true },
  });
  if (!image) {
    return { status: "not_found", message: "That image could not be found." };
  }

  // Remove from storage first. Legacy rows (null publicId) skip this step.
  if (image.publicId) {
    const destroyed = await storage.destroyImage(image.publicId);
    if (!destroyed.ok) {
      // Keep the row so we never lose track of an asset still in storage.
      return { status: "storage_error", message: destroyed.error };
    }
  }

  await prisma.productImage.delete({ where: { id: imageId } });

  // If the primary image was removed, promote the new first image.
  if (image.isPrimary) {
    const next = await prisma.productImage.findFirst({
      where: { productId: image.productId },
      orderBy: { position: "asc" },
      select: { id: true },
    });
    if (next) {
      await prisma.productImage.update({
        where: { id: next.id },
        data: { isPrimary: true },
      });
    }
  }

  const images = await listProductImages(image.productId);
  return {
    status: "ok",
    message: "Image deleted.",
    images,
    productId: image.productId,
  };
}
