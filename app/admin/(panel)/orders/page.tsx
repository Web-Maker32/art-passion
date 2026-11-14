import type { Metadata } from "next";
import { io } from "next/cache";
import { Banknote, CheckCircle2, Clock, Truck } from "lucide-react";
import { OrderStatus } from "@/generated/prisma/client";
import { requireAdmin } from "@/lib/admin-auth";
import {
  ADMIN_ORDER_SEARCH_MAX_LENGTH,
  getAdminOrdersSummary,
  listAdminOrders,
  type AdminOrderDateRange,
  type AdminOrderStatusTab,
} from "@/lib/queries/admin-orders";
import { formatPrice } from "@/lib/format";
import { AdminOrdersTable } from "@/components/admin/admin-orders-table";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { OrdersFilterBar } from "@/components/admin/orders-filter-bar";
import { OrdersPagination } from "@/components/admin/orders-pagination";
import { StatCard } from "@/components/admin/stat-card";
import { Chip } from "@/components/admin/chip";

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

const validStatuses = new Set<string>([
  ...Object.values(OrderStatus),
  "ACTIVE",
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
  await io();
  const params = await searchParams;

  const rawStatus = firstString(params.status) || "ACTIVE";
  const status = (
    validStatuses.has(rawStatus) ? rawStatus : "ACTIVE"
  ) as AdminOrderStatusTab;
  const search = firstString(params.search)
    .trim()
    .slice(0, ADMIN_ORDER_SEARCH_MAX_LENGTH);
  const page = Math.max(1, Number.parseInt(firstString(params.page), 10) || 1);
  const rawDate = firstString(params.date);
  const dateRange: AdminOrderDateRange =
    rawDate === "7d" || rawDate === "30d" ? rawDate : "all";
  const paymentReported = firstString(params.reported) === "1";

  // The page rows and the summary strip are independent reads — run them in
  // parallel so neither blocks the other.
  const [result, summary] = await Promise.all([
    listAdminOrders({ status, search, page, dateRange, paymentReported }),
    getAdminOrdersSummary(),
  ]);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Orders"
        description="Active orders first. Filter by status or search by order number, name or phone."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Clock}
          label="Needs action"
          value={summary.needsAction}
          tone={summary.needsAction > 0 ? "gold" : "default"}
          hint={
            summary.needsActionReported > 0 ? (
              <Chip tone="gold">
                {summary.needsActionReported} payment reported
              </Chip>
            ) : (
              "Pending orders awaiting payment."
            )
          }
          href="/admin/orders?status=PENDING"
        />
        <StatCard
          icon={Truck}
          label="To ship"
          value={summary.toShip}
          hint="Paid and processing orders to pack."
          href="/admin/orders?status=PAID"
        />
        <StatCard
          icon={CheckCircle2}
          label="Delivered this month"
          value={summary.deliveredThisMonth}
          hint="Karachi month, by delivery time."
          href="/admin/orders?status=DELIVERED"
        />
        <StatCard
          icon={Banknote}
          label="Revenue this month"
          value={formatPrice(summary.revenueThisMonth)}
          hint="excluding pending and cancelled"
          href="/admin/orders"
        />
      </div>

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
        pageSize={result.pageSize}
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