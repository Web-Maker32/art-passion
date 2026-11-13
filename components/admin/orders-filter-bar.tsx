import Link from "next/link";
import type {
  AdminOrderDateRange,
  AdminOrderStatusCounts,
} from "@/lib/queries/admin-orders";
import { orderStatusChoices } from "@/components/admin/order-status-badge";
import { Button, buttonVariants } from "@/components/ui/button";

const controlClass =
  "h-11 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";

function tabHref(
  tab: string,
  search: string,
  dateRange: AdminOrderDateRange,
  paymentReported: boolean,
): string {
  const params = new URLSearchParams();
  if (tab !== "ALL") params.set("status", tab);
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
  status: string;
  search: string;
  dateRange: AdminOrderDateRange;
  paymentReported: boolean;
  counts: AdminOrderStatusCounts;
}) {
  const tabs = [{ value: "ALL", label: "All" }, ...orderStatusChoices];
  return (
    <div className="space-y-3">
      <nav
        aria-label="Filter orders by status"
        className="flex gap-2 overflow-x-auto pb-1"
      >
        {tabs.map((tab) => {
          const active = status === tab.value;
          const count = counts[tab.value as keyof AdminOrderStatusCounts] ?? 0;
          return (
            <Link
              key={tab.value}
              href={tabHref(tab.value, search, dateRange, paymentReported)}
              aria-current={active ? "true" : undefined}
              className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-medium whitespace-nowrap transition-colors motion-reduce:transition-none ${
                active
                  ? "bg-brand text-brand-foreground border-transparent"
                  : "border-silver bg-card hover-fine:hover:bg-muted"
              }`}
            >
              {tab.label}
              <span
                className={`rounded-full px-2 text-xs ${
                  active ? "bg-brand-foreground/20" : "bg-foreground/10"
                }`}
              >
                {count}
                <span className="sr-only"> orders</span>
              </span>
            </Link>
          );
        })}
      </nav>

      <form
        action="/admin/orders"
        className="flex flex-col gap-3 sm:flex-row sm:items-end"
        method="get"
      >
        <input type="hidden" name="status" value={status} />

        <div className="flex flex-1 flex-col gap-1.5">
          <label className="text-sm font-medium" htmlFor="orders-search">
            Search
          </label>
          <input
            className={controlClass}
            defaultValue={search}
            id="orders-search"
            maxLength={64}
            name="search"
            placeholder="Order number, name or phone"
            type="search"
          />
        </div>

        <div className="flex flex-col gap-1.5 sm:w-44">
          <label className="text-sm font-medium" htmlFor="orders-date">
            Placed
          </label>
          <select
            className={controlClass}
            defaultValue={dateRange}
            id="orders-date"
            name="date"
          >
            <option value="all">All time</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
          </select>
        </div>

        <label
          className="flex min-h-11 cursor-pointer items-center gap-2 text-sm font-medium sm:pb-0"
          htmlFor="orders-reported"
        >
          <input
            className="accent-brand size-5"
            defaultChecked={paymentReported}
            id="orders-reported"
            name="reported"
            type="checkbox"
            value="1"
          />
          Payment reported
        </label>

        <div className="flex gap-2">
          <Button className="min-h-11" type="submit">
            Apply
          </Button>
          <Link
            className={buttonVariants({
              variant: "outline",
              className: "min-h-11",
            })}
            href="/admin/orders"
          >
            Reset
          </Link>
        </div>
      </form>
    </div>
  );
}
