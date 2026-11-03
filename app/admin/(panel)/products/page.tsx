import type { Metadata } from "next";
import { ProductStatus } from "@/generated/prisma/client";
import type { ProductStatus as ProductStatusType } from "@/generated/prisma/client";
import { requireAdmin } from "@/lib/admin-auth";
import { listAdminProducts } from "@/lib/queries/admin-products";
import { AdminProductsTable } from "@/components/admin/admin-products-table";
import { ProductsFilterBar } from "@/components/admin/products-filter-bar";
import { ProductsPagination } from "@/components/admin/products-pagination";

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
}>;

const validStatuses = new Set<string>([...Object.values(ProductStatus), "ALL"]);

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
  const params = await searchParams;

  const rawStatus = firstString(params.status) || "ALL";
  const status = (
    validStatuses.has(rawStatus) ? rawStatus : "ALL"
  ) as ProductStatusType | "ALL";
  const search = firstString(params.search).trim();
  const page = Math.max(1, Number.parseInt(firstString(params.page), 10) || 1);

  const result = await listAdminProducts({ status, search, page });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold sm:text-3xl">Products</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Manage your catalogue. Search by title, filter by status, or edit stock inline.
        </p>
      </div>

      <ProductsFilterBar search={search} status={status} />

      <AdminProductsTable products={result.products} />

      <ProductsPagination
        page={result.page}
        search={search}
        status={status}
        total={result.total}
        totalPages={result.totalPages}
      />
    </div>
  );
}
