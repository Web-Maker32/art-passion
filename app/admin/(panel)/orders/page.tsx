import type { Metadata } from "next";
import { OrderStatus } from "@/generated/prisma/client";
import type { OrderStatus as OrderStatusType } from "@/generated/prisma/client";
import { requireAdmin } from "@/lib/admin-auth";
import { listAdminOrders } from "@/lib/queries/admin-orders";
import { AdminOrdersTable } from "@/components/admin/admin-orders-table";
import { OrdersFilterBar } from "@/components/admin/orders-filter-bar";
import { OrdersPagination } from "@/components/admin/orders-pagination";

export const metadata: Metadata = {
  title: "Orders",
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

const validStatuses = new Set<string>([
  ...Object.values(OrderStatus),
  "ALL",
]);

function firstString(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireAdmin();
  const params = await searchParams;

  const rawStatus = firstString(params.status) || "ALL";
  const status = (
    validStatuses.has(rawStatus) ? rawStatus : "ALL"
  ) as OrderStatusType | "ALL";
  const search = firstString(params.search).trim();
  const page = Math.max(1, Number.parseInt(firstString(params.page), 10) || 1);

  const result = await listAdminOrders({ status, search, page });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold sm:text-3xl">Orders</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Newest first. Filter by status or search by order number, name or phone.
        </p>
      </div>

      <OrdersFilterBar status={status} search={search} />

      <AdminOrdersTable orders={result.orders} />

      <OrdersPagination
        page={result.page}
        search={search}
        status={status}
        total={result.total}
        totalPages={result.totalPages}
      />
    </div>
  );
}
