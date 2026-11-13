import Link from "next/link";
import type { AdminOrderDateRange } from "@/lib/queries/admin-orders";
import { buttonVariants } from "@/components/ui/button";

function buildHref(
  page: number,
  status: string,
  search: string,
  dateRange: AdminOrderDateRange,
  paymentReported: boolean,
): string {
  const params = new URLSearchParams();
  if (status && status !== "ALL") params.set("status", status);
  if (search) params.set("search", search);
  if (dateRange !== "all") params.set("date", dateRange);
  if (paymentReported) params.set("reported", "1");
  params.set("page", String(page));
  return `/admin/orders?${params.toString()}`;
}

export function OrdersPagination({
  page,
  totalPages,
  total,
  status,
  search,
  dateRange,
  paymentReported,
}: {
  page: number;
  totalPages: number;
  total: number;
  status: string;
  search: string;
  dateRange: AdminOrderDateRange;
  paymentReported: boolean;
}) {
  if (totalPages <= 1) {
    return (
      <p className="text-muted-foreground text-sm">
        {total} {total === 1 ? "order" : "orders"}
      </p>
    );
  }

  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  return (
    <nav
      aria-label="Orders pagination"
      className="flex items-center justify-between gap-3"
    >
      <p className="text-muted-foreground text-sm">
        Page {page} of {totalPages} · {total} orders
      </p>
      <div className="flex gap-2">
        {hasPrev ? (
          <Link
            className={buttonVariants({ variant: "outline", size: "sm" })}
            href={buildHref(
              page - 1,
              status,
              search,
              dateRange,
              paymentReported,
            )}
          >
            Previous
          </Link>
        ) : (
          <span
            aria-disabled="true"
            className={buttonVariants({
              variant: "outline",
              size: "sm",
              className: "pointer-events-none opacity-50",
            })}
          >
            Previous
          </span>
        )}
        {hasNext ? (
          <Link
            className={buttonVariants({ variant: "outline", size: "sm" })}
            href={buildHref(
              page + 1,
              status,
              search,
              dateRange,
              paymentReported,
            )}
          >
            Next
          </Link>
        ) : (
          <span
            aria-disabled="true"
            className={buttonVariants({
              variant: "outline",
              size: "sm",
              className: "pointer-events-none opacity-50",
            })}
          >
            Next
          </span>
        )}
      </div>
    </nav>
  );
}
