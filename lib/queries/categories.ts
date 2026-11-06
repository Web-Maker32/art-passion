import "server-only";

import { cacheLife } from "next/cache";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";

export { categoryDescriptions } from "@/lib/catalog";

const categorySelect = {
  id: true,
  name: true,
  slug: true,
  _count: {
    select: {
      products: { where: { status: "PUBLISHED" } },
    },
  },
} satisfies Prisma.CategorySelect;

export type StoreCategory = Prisma.CategoryGetPayload<{
  select: typeof categorySelect;
}>;

export async function getPublishedCategories(): Promise<StoreCategory[]> {
  "use cache";
  cacheLife("hours");

  return prisma.category.findMany({
    where: { products: { some: { status: "PUBLISHED" } } },
    orderBy: { name: "asc" },
    select: categorySelect,
  });
}

export async function getCategoryBySlug(
  slug: string,
): Promise<StoreCategory | null> {
  "use cache";
  cacheLife("hours");

  // Categories with no published products still resolve so the storefront can
  // show a friendly empty state instead of a 404.
  return prisma.category.findUnique({
    where: { slug },
    select: categorySelect,
  });
}

export async function getPublishedCategorySlugs(): Promise<
  Array<{ slug: string }>
> {
  return prisma.category.findMany({
    where: { products: { some: { status: "PUBLISHED" } } },
    select: { slug: true },
  });
}
