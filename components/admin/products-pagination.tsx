import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

function buildHref(page: number, status: string, search: string): string {
  const params = new URLSearchParams();
  if (status && status !== "ALL") params.set("status", status);
  if (search) params.set("search", search);
  params.set("page", String(page));
  return `/admin/products?${params.toString()}`;
}

export function ProductsPagination({
  page,
  totalPages,
  total,
  status,
  search,
}: {
  page: number;
  totalPages: number;
  total: number;
  status: string;
  search: string;
}) {
  if (totalPages <= 1) {
    return (
      <p className="text-muted-foreground text-sm">
        {total} {total === 1 ? "product" : "products"}
      </p>
    );
  }

  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  return (
    <nav
      aria-label="Products pagination"
      className="flex items-center justify-between gap-3"
    >
      <p className="text-muted-foreground text-sm">
        Page {page} of {totalPages} · {total} products
      </p>
      <div className="flex gap-2">
        {hasPrev ? (
          <Link
            className={buttonVariants({ variant: "outline", size: "sm" })}
            href={buildHref(page - 1, status, search)}
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
            href={buildHref(page + 1, status, search)}
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
