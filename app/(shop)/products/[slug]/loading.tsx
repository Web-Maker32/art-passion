export default function ProductLoading() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading product"
      className="skeleton-shimmer mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12"
    >
      <div className="h-4 w-64 max-w-full rounded bg-muted" />
      <div className="mt-5 grid gap-8 lg:grid-cols-2 lg:gap-12">
        <div>
          <div className="aspect-square rounded-2xl bg-muted" />
          <div className="mt-3 flex gap-3">
            {Array.from({ length: 4 }, (_, index) => (
              <div
                className="size-16 shrink-0 rounded-xl bg-muted sm:size-20"
                key={index}
              />
            ))}
          </div>
        </div>
        <div className="space-y-5">
          <div className="h-5 w-40 rounded-full bg-muted" />
          <div className="h-10 w-3/4 rounded-lg bg-muted" />
          <div className="h-6 w-1/3 rounded bg-muted" />
          <div className="h-24 rounded bg-muted" />
          <div className="h-60 rounded-2xl bg-muted" />
        </div>
      </div>
    </div>
  );
}