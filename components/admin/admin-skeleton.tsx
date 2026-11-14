import { cn } from "cn";
import { TableCard } from "@/components/admin/admin-cards";

/**
 * Loading placeholders that mirror the real card/table layout. The shared
 * skeleton-shimmer utility animates the .bg-muted blocks and is disabled for
 * reduced-motion users.
 */
export function AdminTableSkeleton({
  rows = 6,
  className,
}: {
  rows?: number;
  className?: string;
}) {
  return (
    <TableCard
      aria-label="Loading"
      className={cn("skeleton-shimmer", className)}
      role="status"
    >
      <div aria-hidden="true">
        <div className="bg-muted/60 flex h-11 items-center gap-4 border-b px-4">
          <div className="bg-muted h-2.5 w-24 rounded-full" />
          <div className="bg-muted h-2.5 w-20 rounded-full" />
          <div className="bg-muted ml-auto h-2.5 w-16 rounded-full" />
        </div>
        {Array.from({ length: rows }, (_, index) => (
          <div
            className="flex h-16 items-center gap-4 border-b px-4 last:border-b-0"
            key={index}
          >
            <div className="bg-muted size-8 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="bg-muted h-3 w-1/3 min-w-24 rounded-full" />
              <div className="bg-muted h-2.5 w-1/4 min-w-16 rounded-full" />
            </div>
            <div className="bg-muted h-6 w-20 shrink-0 rounded-full" />
            <div className="bg-muted hidden h-3 w-14 shrink-0 rounded-full sm:block" />
          </div>
        ))}
      </div>
    </TableCard>
  );
}

export function AdminStatCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "skeleton-shimmer bg-card rounded-[12px] border p-4",
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <div className="bg-muted size-9 rounded-[8px]" />
        <div className="bg-muted h-3 w-20 rounded-full" />
      </div>
      <div className="bg-muted mt-4 h-7 w-16 rounded-md" />
      <div className="bg-muted mt-3 h-2.5 w-24 rounded-full" />
    </div>
  );
}