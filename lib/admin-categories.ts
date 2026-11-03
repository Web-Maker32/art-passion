import "server-only";

import { prisma } from "@/lib/db";
import { slugifyTitle } from "@/lib/admin-product-schema";
import type { AdminCategoryRow } from "@/lib/admin-category-schema";

/**
 * Server-side category management for the admin: list with product counts,
 * create (auto-generates a unique slug) and rename (keeps the slug stable so
 * storefront URLs and existing product relations keep working). Consumed by
 * actions/admin-categories.ts.
 */

export type { AdminCategoryRow };

export type CategoryMutationResult =
  | { status: "created"; id: string; message: string }
  | { status: "renamed"; message: string }
  | { status: "not_found" }
  | { status: "name_taken" };

export async function listAdminCategories(): Promise<AdminCategoryRow[]> {
  const rows = await prisma.category.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      _count: { select: { products: true } },
    },
  });
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    productCount: row._count.products,
  }));
}

async function isNameTaken(
  name: string,
  categoryId?: string,
): Promise<boolean> {
  const existing = await prisma.category.findFirst({
    where: { name: { equals: name, mode: "insensitive" } },
    select: { id: true },
  });
  return existing !== null && existing.id !== categoryId;
}

async function isSlugTaken(slug: string): Promise<boolean> {
  const existing = await prisma.category.findUnique({
    where: { slug },
    select: { id: true },
  });
  return existing !== null;
}

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

export async function createCategory(
  name: string,
): Promise<CategoryMutationResult> {
  if (await isNameTaken(name)) return { status: "name_taken" };

  const base = slugifyTitle(name);
  if (!base) return { status: "name_taken" };
  const slug = await findFreeSlug(base);

  const created = await prisma.category.create({
    data: { name, slug },
    select: { id: true },
  });
  return { status: "created", id: created.id, message: "Category created." };
}

export async function renameCategory(
  id: string,
  name: string,
): Promise<CategoryMutationResult> {
  const existing = await prisma.category.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!existing) return { status: "not_found" };

  if (await isNameTaken(name, id)) return { status: "name_taken" };

  // Only the display name changes; the slug stays stable so storefront URLs
  // and product relations keep working.
  await prisma.category.update({ where: { id }, data: { name } });
  return { status: "renamed", message: "Category renamed." };
}
