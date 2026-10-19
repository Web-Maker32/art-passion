import "server-only";

import { cacheLife } from "next/cache";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";

export const categoryDescriptions: Record<string, string> = {
  "felt-sets": "Hand-stitched felt friends for imaginative, screen-free play.",
  "coloring-kits": "Thoughtful coloring and painting kits for little creators.",
  "gift-sets": "Handmade gifts made to bring a little joy to someone special.",
};

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

  return prisma.category.findFirst({
    where: { slug, products: { some: { status: "PUBLISHED" } } },
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
