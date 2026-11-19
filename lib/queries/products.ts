import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { CATALOG_CACHE_TAG } from "@/lib/catalog-cache";
import type { ProductFilters } from "@/lib/product-filters";

const productCardSelect = {
  id: true,
  title: true,
  slug: true,
  description: true,
  type: true,
  madeToOrder: true,
  createdAt: true,
  category: { select: { name: true, slug: true } },
  images: {
    orderBy: [{ isPrimary: "desc" }, { position: "asc" }],
    take: 2,
    select: { url: true, alt: true },
  },
  variants: {
    orderBy: { price: "asc" },
    select: { id: true, label: true, price: true, stock: true },
  },
} satisfies Prisma.ProductSelect;

export type ProductCardData = Prisma.ProductGetPayload<{
  select: typeof productCardSelect;
}>;

const productDetailSelect = {
  ...productCardSelect,
  shortDescription: true,
  whatsIncluded: true,
  size: true,
  recommendedAge: true,
  safetyNote: true,
  materials: true,
  tags: true,
  leadTimeDays: true,
  images: {
    orderBy: [{ isPrimary: "desc" }, { position: "asc" }],
    select: { id: true, url: true, alt: true, position: true },
  },
  variants: {
    orderBy: { price: "asc" },
    select: { id: true, sku: true, label: true, price: true, stock: true },
  },
} satisfies Prisma.ProductSelect;

export type ProductDetailData = Prisma.ProductGetPayload<{
  select: typeof productDetailSelect;
}>;

export type ProductListingOptions = {
  filters?: ProductFilters;
  categorySlug?: string;
};

export async function getPublishedProducts({
  filters,
  categorySlug,
}: ProductListingOptions = {}): Promise<ProductCardData[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(CATALOG_CACHE_TAG);

  const priceFilter =
    filters?.minPrice !== undefined || filters?.maxPrice !== undefined
      ? {
          ...(filters.minPrice !== undefined
            ? { gte: filters.minPrice }
            : {}),
          ...(filters.maxPrice !== undefined
            ? { lte: filters.maxPrice }
            : {}),
        }
      : undefined;

  const variantPriceFilter = priceFilter ? { price: priceFilter } : undefined;

  // "In stock only" must still surface made-to-order products, which ignore
  // physical stock. Ready-made products need a variant with stock (and price).
  const availabilityFilter: Prisma.ProductWhereInput | undefined = filters?.inStock
    ? {
        OR: [
          {
            madeToOrder: true,
            ...(variantPriceFilter
              ? { variants: { some: variantPriceFilter } }
              : {}),
          },
          {
            variants: {
              some: { stock: { gt: 0 }, ...(variantPriceFilter ?? {}) },
            },
          },
        ],
      }
    : variantPriceFilter
      ? { variants: { some: variantPriceFilter } }
      : undefined;

  const category = categorySlug ?? filters?.category;
  const products = await prisma.product.findMany({
    where: {
      status: "PUBLISHED",
      ...(category ? { category: { slug: category } } : {}),
      ...(filters?.type ? { type: filters.type } : {}),
      ...(availabilityFilter ?? {}),
    },
    orderBy: { createdAt: "desc" },
    select: productCardSelect,
  });

  if (filters && (filters.sort === "price-asc" || filters.sort === "price-desc")) {
    const direction = filters.sort === "price-asc" ? 1 : -1;
    return products.sort((left, right) => {
      const leftPrice = left.variants[0]?.price;
      const rightPrice = right.variants[0]?.price;
      if (leftPrice === undefined) return rightPrice === undefined ? 0 : 1;
      if (rightPrice === undefined) return -1;
      return (leftPrice - rightPrice) * direction;
    });
  }

  return products;
}

export async function getRelatedProducts({
  categorySlug,
  productSlug,
}: {
  categorySlug: string;
  productSlug: string;
}): Promise<ProductCardData[]> {
  const categoryProducts = await getPublishedProducts({ categorySlug });
  const related = categoryProducts
    .filter((product) => product.slug !== productSlug)
    .slice(0, 4);

  if (related.length === 4) return related;

  const excludedSlugs = new Set([
    productSlug,
    ...related.map((product) => product.slug),
  ]);
  const fallback = (await getPublishedProducts())
    .filter((product) => !excludedSlugs.has(product.slug))
    .slice(0, 4 - related.length);

  return [...related, ...fallback];
}

export async function getFeaturedProducts(take = 4): Promise<ProductCardData[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(CATALOG_CACHE_TAG);

  return prisma.product.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { createdAt: "desc" },
    take,
    select: productCardSelect,
  });
}

export async function getProductBySlug(
  slug: string,
): Promise<ProductDetailData | null> {
  "use cache";
  cacheLife("hours");
  cacheTag(CATALOG_CACHE_TAG);

  return prisma.product.findFirst({
    where: { slug, status: "PUBLISHED" },
    select: productDetailSelect,
  });
}

export async function getPublishedProductSlugs(): Promise<Array<{ slug: string }>> {
  return prisma.product.findMany({
    where: { status: "PUBLISHED" },
    select: { slug: true },
  });
}

export async function searchPublishedProducts(
  searchTerm: string,
): Promise<ProductCardData[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(CATALOG_CACHE_TAG);

  const query = searchTerm.trim();
  if (!query) return [];

  const tagMatches = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT product."id"
    FROM "Product" AS product
    CROSS JOIN LATERAL unnest(product."tags") AS tag
    WHERE product."status" = 'PUBLISHED'::"ProductStatus"
      AND tag ILIKE ${`%${query}%`}
  `;

  return prisma.product.findMany({
    where: {
      status: "PUBLISHED",
      OR: [
        { title: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } },
        { id: { in: tagMatches.map(({ id }) => id) } },
      ],
    },
    orderBy: { createdAt: "desc" },
    select: productCardSelect,
  });
}
