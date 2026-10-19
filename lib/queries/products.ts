import "server-only";

import { cacheLife } from "next/cache";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import type { ProductFilters } from "@/lib/product-filters";

const productCardSelect = {
  id: true,
  title: true,
  slug: true,
  description: true,
  type: true,
  createdAt: true,
  category: { select: { name: true, slug: true } },
  images: {
    orderBy: { position: "asc" },
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
  materials: true,
  tags: true,
  madeToOrder: true,
  leadTimeDays: true,
  images: {
    orderBy: { position: "asc" },
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

  const priceFilter =
    filters?.minPrice !== undefined || filters?.maxPrice !== undefined
      ? {
          ...(filters.minPrice !== undefined
            ? { gte: filters.minPrice * 100 }
            : {}),
          ...(filters.maxPrice !== undefined
            ? { lte: filters.maxPrice * 100 }
            : {}),
        }
      : undefined;

  const variantsFilter =
    (filters?.inStock ?? false) || priceFilter
      ? {
          ...(filters?.inStock ? { stock: { gt: 0 } } : {}),
          ...(priceFilter ? { price: priceFilter } : {}),
        }
      : undefined;

  const products = await prisma.product.findMany({
    where: {
      status: "PUBLISHED",
      ...(!categorySlug && filters?.category
        ? { category: { slug: filters.category } }
        : {}),
      ...(filters?.type ? { type: filters.type } : {}),
      ...(variantsFilter ? { variants: { some: variantsFilter } } : {}),
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

export async function getFeaturedProducts(take = 4): Promise<ProductCardData[]> {
  "use cache";
  cacheLife("hours");

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
