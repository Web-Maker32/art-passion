import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { AdminProductStockFilter } from "@/lib/queries/admin-products";
import { buttonVariants } from "@/components/ui/button";

function buildHref(
  page: number,
  status: string,
  search: string,
  categoryId: string,
  stock: AdminProductStockFilter,
): string {
  const params = new URLSearchParams();
  if (status && status !== "ALL") params.set("status", status);
  if (search) params.set("search", search);
  if (categoryId) params.set("category", categoryId);
  if (stock !== "all") params.set("stock", stock);
  params.set("page", String(page));
  return `/admin/products?${params.toString()}`;
}

export function ProductsPagination({
  page,
  totalPages,
  total,
  status,
  search,
  categoryId,
  stock,
}: {
  page: number;
  totalPages: number;
  total: number;
  status: string;
  search: string;
  categoryId: string;
  stock: AdminProductStockFilter;
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
      className="flex flex-wrap items-center justify-between gap-3"
    >
      <p className="text-muted-foreground text-sm">
        Page {page} of {totalPages} · {total} products
      </p>
      <div className="flex gap-2">
        {hasPrev ? (
          <Link
            className={buttonVariants({ variant: "outline", size: "sm" })}
            href={buildHref(page - 1, status, search, categoryId, stock)}
          >
            <ChevronLeft aria-hidden="true" data-icon="inline-start" />
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
            href={buildHref(page + 1, status, search, categoryId, stock)}
          >
            Next
            <ChevronRight aria-hidden="true" data-icon="inline-end" />
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
