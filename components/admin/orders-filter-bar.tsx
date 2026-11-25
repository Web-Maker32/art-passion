import Link from "next/link";
import type {
  AdminOrderDateRange,
  AdminOrderStatusCounts,
  AdminOrderStatusTab,
} from "@/lib/queries/admin-orders";
import { orderStatusChoices } from "@/components/admin/order-status-badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { AdminSearchInput } from "@/components/admin/admin-search-input";
import { AdminSelect, ToggleChip } from "@/components/admin/admin-controls";
import { StatusTabs } from "@/components/admin/status-tabs";
import { ADMIN_ORDER_SEARCH_MAX_LENGTH } from "@/lib/queries/admin-orders";

const tabs: Array<{ value: AdminOrderStatusTab; label: string }> = [
  { value: "ACTIVE", label: "Active" },
  { value: "TO_SHIP", label: "To ship" },
  ...orderStatusChoices,
  { value: "ALL", label: "All" },
];

function tabHref(
  tab: AdminOrderStatusTab,
  search: string,
  dateRange: AdminOrderDateRange,
  paymentReported: boolean,
): string {
  const params = new URLSearchParams();
  if (tab !== "ACTIVE") params.set("status", tab);
  if (search) params.set("search", search);
  if (dateRange !== "all") params.set("date", dateRange);
  if (paymentReported) params.set("reported", "1");
  const query = params.toString();
  return query ? `/admin/orders?${query}` : "/admin/orders";
}

export function OrdersFilterBar({
  status,
  search,
  dateRange,
  paymentReported,
  counts,
}: {
  status: AdminOrderStatusTab;
  search: string;
  dateRange: AdminOrderDateRange;
  paymentReported: boolean;
  counts: AdminOrderStatusCounts;
}) {
  return (
    <div className="space-y-3">
      <StatusTabs
        ariaLabel="Filter orders by status"
        tabs={tabs.map((tab) => ({
          value: tab.value,
          href: tabHref(tab.value, search, dateRange, paymentReported),
          label: tab.label,
          count: counts[tab.value] ?? 0,
          active: status === tab.value,
        }))}
      />

      <form
        action="/admin/orders"
        className="bg-card flex flex-col gap-3 rounded-[12px] border p-4 lg:flex-row lg:items-end"
        method="get"
      >
        <input type="hidden" name="status" value={status} />

        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <label className="text-[13px] font-medium" htmlFor="orders-search">
            Search
          </label>
          <AdminSearchInput
            defaultValue={search}
            id="orders-search"
            maxLength={ADMIN_ORDER_SEARCH_MAX_LENGTH}
            name="search"
            placeholder="Order number, name or phone"
          />
        </div>

        <div className="flex flex-col gap-1.5 sm:w-44">
          <label className="text-[13px] font-medium" htmlFor="orders-date">
            Placed
          </label>
          <AdminSelect defaultValue={dateRange} id="orders-date" name="date">
            <option value="all">All time</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
          </AdminSelect>
        </div>

        <ToggleChip
          className="lg:mb-0"
          defaultChecked={paymentReported}
          id="orders-reported"
          label="Payment reported"
          name="reported"
        />

        <div className="flex gap-2">
          <Button type="submit">Apply</Button>
          <Link
            className={buttonVariants({ variant: "outline" })}
            href="/admin/orders"
          >
            Reset
          </Link>
        </div>
      </form>
    </div>
  );
}
