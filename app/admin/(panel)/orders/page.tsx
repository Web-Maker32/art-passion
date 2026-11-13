import type { Metadata } from "next";
import { io } from "next/cache";
import { OrderStatus } from "@/generated/prisma/client";
import type { OrderStatus as OrderStatusType } from "@/generated/prisma/client";
import { requireAdmin } from "@/lib/admin-auth";
import {
  ADMIN_ORDER_SEARCH_MAX_LENGTH,
  listAdminOrders,
  type AdminOrderDateRange,
} from "@/lib/queries/admin-orders";
import { AdminOrdersTable } from "@/components/admin/admin-orders-table";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
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
  date?: string | string[];
  reported?: string | string[];
}>;

const validStatuses = new Set<string>([...Object.values(OrderStatus), "ALL"]);

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
  await io();
  const params = await searchParams;

  const rawStatus = firstString(params.status) || "ALL";
  const status = (validStatuses.has(rawStatus) ? rawStatus : "ALL") as
    OrderStatusType | "ALL";
  const search = firstString(params.search)
    .trim()
    .slice(0, ADMIN_ORDER_SEARCH_MAX_LENGTH);
  const page = Math.max(1, Number.parseInt(firstString(params.page), 10) || 1);
  const rawDate = firstString(params.date);
  const dateRange: AdminOrderDateRange =
    rawDate === "7d" || rawDate === "30d" ? rawDate : "all";
  const paymentReported = firstString(params.reported) === "1";

  const result = await listAdminOrders({
    status,
    search,
    page,
    dateRange,
    paymentReported,
  });

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Orders"
        description="Newest first. Filter by status or search by order number, name or phone."
      />

      <OrdersFilterBar
        status={status}
        search={search}
        dateRange={dateRange}
        paymentReported={paymentReported}
        counts={result.counts}
      />

      <AdminOrdersTable orders={result.orders} />

      <OrdersPagination
        page={result.page}
        search={search}
        status={status}
        dateRange={dateRange}
        paymentReported={paymentReported}
        total={result.total}
        totalPages={result.totalPages}
      />
    </div>
  );
}
