import type { Metadata } from "next";
import Link from "next/link";
import { io } from "next/cache";
import { ProductStatus } from "@/generated/prisma/client";
import type { ProductStatus as ProductStatusType } from "@/generated/prisma/client";
import { requireAdmin } from "@/lib/admin-auth";
import {
  ADMIN_PRODUCT_SEARCH_MAX_LENGTH,
  listAdminProducts,
  listCategoriesForAdmin,
  type AdminProductStockFilter,
} from "@/lib/queries/admin-products";
import { AdminProductsTable } from "@/components/admin/admin-products-table";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ProductsFilterBar } from "@/components/admin/products-filter-bar";
import { ProductsPagination } from "@/components/admin/products-pagination";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Products",
  robots: { index: false, follow: false },
};

// cacheComponents: requireAdmin() reads the session cookie and evaluates
// Date.now(), which blocks prerendering. Render this page at request time.
export const instant = false;

type SearchParams = Promise<{
  status?: string | string[];
  search?: string | string[];
  page?: string | string[];
  category?: string | string[];
  stock?: string | string[];
}>;

const validStatuses = new Set<string>([...Object.values(ProductStatus), "ALL"]);
const validStockFilters = new Set<string>(["all", "in", "low", "out"]);

function firstString(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireAdmin();
  await io();
  const params = await searchParams;

  const rawStatus = firstString(params.status) || "ALL";
  const status = (validStatuses.has(rawStatus) ? rawStatus : "ALL") as
    ProductStatusType | "ALL";
  const search = firstString(params.search)
    .trim()
    .slice(0, ADMIN_PRODUCT_SEARCH_MAX_LENGTH);
  const page = Math.max(1, Number.parseInt(firstString(params.page), 10) || 1);
  const categoryId = firstString(params.category).trim();
  const rawStock = firstString(params.stock);
  const stock = (
    validStockFilters.has(rawStock) ? rawStock : "all"
  ) as AdminProductStockFilter;

  const [result, categories] = await Promise.all([
    listAdminProducts({ status, search, page, categoryId, stock }),
    listCategoriesForAdmin(),
  ]);
  // Only keep a category filter that still exists.
  const activeCategoryId = categories.some(
    (category) => category.id === categoryId,
  )
    ? categoryId
    : "";

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Products"
        description="Manage your catalogue. Search by name or SKU, filter by status, category or stock, and edit stock inline."
        actions={
          <Link className={buttonVariants()} href="/admin/products/new">
            + New product
          </Link>
        }
      />

      <ProductsFilterBar
        search={search}
        status={status}
        categoryId={activeCategoryId}
        stock={stock}
        categories={categories}
      />

      <AdminProductsTable products={result.products} />

      <ProductsPagination
        page={result.page}
        search={search}
        status={status}
        categoryId={activeCategoryId}
        stock={stock}
        total={result.total}
        totalPages={result.totalPages}
      />
    </div>
  );
}
