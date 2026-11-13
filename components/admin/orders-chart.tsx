import type { DashboardDayBucket } from "@/lib/queries/admin-dashboard";

/**
 * Orders-per-day bar chart drawn with plain CSS — no chart library. Each bar
 * carries a native title tooltip; screen readers get a full text summary.
 */
export function OrdersChart({ buckets }: { buckets: DashboardDayBucket[] }) {
  const max = Math.max(1, ...buckets.map((bucket) => bucket.count));
  const total = buckets.reduce((sum, bucket) => sum + bucket.count, 0);
  const busiest = buckets.reduce(
    (best, bucket) => (bucket.count > best.count ? bucket : best),
    buckets[0],
  );
  const today = buckets[buckets.length - 1];

  return (
    <figure className="m-0">
      <div aria-hidden="true" className="flex h-36 items-end gap-1 sm:gap-1.5">
        {buckets.map((bucket) => {
          const isToday = bucket.date === today?.date;
          const height =
            bucket.count === 0 ? 2 : Math.max(6, (bucket.count / max) * 85);
          return (
            <div
              key={bucket.date}
              className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1"
            >
              {bucket.count > 0 && (
                <span className="text-muted-foreground text-[10px] leading-none font-medium">
                  {bucket.count}
                </span>
              )}
              <div
                title={`${bucket.label}: ${bucket.count} ${bucket.count === 1 ? "order" : "orders"}`}
                className={`duration-interaction w-full rounded-t-sm transition-colors motion-reduce:transition-none ${
                  bucket.count === 0
                    ? "bg-border"
                    : isToday
                      ? "bg-gold hover-fine:hover:bg-gold-light"
                      : "bg-brand/80 hover-fine:hover:bg-brand"
                }`}
                style={{ height: `${height}%` }}
              />
            </div>
          );
        })}
      </div>
      <div aria-hidden="true" className="mt-1 flex gap-1 sm:gap-1.5">
        {buckets.map((bucket) => (
          <span
            key={bucket.date}
            className="text-muted-foreground min-w-0 flex-1 truncate text-center text-[10px] leading-4"
          >
            <span className="sm:hidden">{bucket.day}</span>
            <span className="hidden sm:inline">{bucket.label}</span>
          </span>
        ))}
      </div>
      <figcaption className="text-muted-foreground mt-2 text-xs">
        Today is highlighted in gold. All days use Asia/Karachi.
      </figcaption>
      <p className="sr-only">
        {total === 0
          ? "No orders in the last 14 days."
          : `${total} ${total === 1 ? "order" : "orders"} in the last 14 days. Busiest day: ${busiest?.label} with ${busiest?.count}.`}
      </p>
      <ul className="sr-only">
        {buckets.map((bucket) => (
          <li key={bucket.date}>
            {bucket.label}: {bucket.count}{" "}
            {bucket.count === 1 ? "order" : "orders"}
          </li>
        ))}
      </ul>
    </figure>
  );
}
