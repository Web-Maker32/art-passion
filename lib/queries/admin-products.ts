import "server-only";

import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import type { ProductStatus } from "@/generated/prisma/client";

export const ADMIN_PRODUCTS_PAGE_SIZE = 12;

export type AdminProductListFilters = {
  status?: ProductStatus | "ALL";
  search?: string;
  page?: number;
};

export type AdminProductListRow = {
  id: string;
  title: string;
  slug: string;
  status: ProductStatus;
  madeToOrder: boolean;
  minPrice: number | null;
  maxPrice: number | null;
  totalStock: number;
  thumbnail: { url: string; alt: string } | null;
  variants: Array<{
    id: string;
    label: string;
    sku: string | null;
    price: number;
    stock: number;
  }>;
};

export type AdminProductListResult = {
  products: AdminProductListRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

function buildListWhere(filters: AdminProductListFilters): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = {};

  if (filters.status && filters.status !== "ALL") {
    where.status = filters.status;
  }

  const search = filters.search?.trim();
  if (search) {
    where.title = { contains: search, mode: "insensitive" };
  }

  return where;
}

export async function listAdminProducts(
  filters: AdminProductListFilters = {},
): Promise<AdminProductListResult> {
  const pageSize = ADMIN_PRODUCTS_PAGE_SIZE;
  const page = Math.max(1, filters.page ?? 1);
  const where = buildListWhere(filters);

  const [total, rows] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        madeToOrder: true,
        images: {
          orderBy: { position: "asc" },
          take: 1,
          select: { url: true, alt: true },
        },
        variants: {
          orderBy: { price: "asc" },
          select: { id: true, label: true, sku: true, price: true, stock: true },
        },
      },
    }),
  ]);

  const products: AdminProductListRow[] = rows.map((row) => {
    const prices = row.variants.map((variant) => variant.price);
    return {
      id: row.id,
      title: row.title,
      slug: row.slug,
      status: row.status,
      madeToOrder: row.madeToOrder,
      minPrice: prices.length > 0 ? Math.min(...prices) : null,
      maxPrice: prices.length > 0 ? Math.max(...prices) : null,
      totalStock: row.variants.reduce((sum, variant) => sum + variant.stock, 0),
      thumbnail: row.images[0] ?? null,
      variants: row.variants,
    };
  });

  return {
    products,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export const adminProductEditSelect = {
  id: true,
  title: true,
  slug: true,
  description: true,
  categoryId: true,
  type: true,
  status: true,
  madeToOrder: true,
  leadTimeDays: true,
  materials: true,
  tags: true,
  variants: {
    orderBy: { price: "asc" },
    select: { id: true, label: true, sku: true, price: true, stock: true },
  },
  images: {
    orderBy: [{ isPrimary: "desc" }, { position: "asc" }],
    select: {
      id: true,
      url: true,
      alt: true,
      position: true,
      isPrimary: true,
      publicId: true,
    },
  },
} satisfies Prisma.ProductSelect;

export type AdminProductEdit = Prisma.ProductGetPayload<{
  select: typeof adminProductEditSelect;
}>;

export async function getAdminProduct(
  productId: string,
): Promise<AdminProductEdit | null> {
  return prisma.product.findUnique({
    where: { id: productId },
    select: adminProductEditSelect,
  });
}

export async function listCategoriesForAdmin(): Promise<
  Array<{ id: string; name: string; slug: string }>
> {
  return prisma.category.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true },
  });
}

export type AdminProductDashboardStats = {
  draftCount: number;
  lowStockVariants: Array<{
    variantId: string;
    productId: string;
    productTitle: string;
    variantLabel: string;
    stock: number;
  }>;
};

/**
 * Dashboard extras: variants with stock <= 2 on non-made-to-order products,
 * plus a count of draft products.
 */
export async function getAdminProductStats(
  lowStockThreshold = 2,
): Promise<AdminProductDashboardStats> {
  const [draftCount, lowStockVariants] = await Promise.all([
    prisma.product.count({ where: { status: "DRAFT" } }),
    prisma.variant.findMany({
      where: {
        stock: { lte: lowStockThreshold },
        product: { madeToOrder: false },
      },
      orderBy: { stock: "asc" },
      take: 8,
      select: {
        id: true,
        label: true,
        stock: true,
        product: { select: { id: true, title: true } },
      },
    }),
  ]);

  return {
    draftCount,
    lowStockVariants: lowStockVariants.map((variant) => ({
      variantId: variant.id,
      productId: variant.product.id,
      productTitle: variant.product.title,
      variantLabel: variant.label,
      stock: variant.stock,
    })),
  };
}
