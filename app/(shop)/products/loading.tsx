export default function ProductsLoading() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading products"
      className="skeleton-shimmer mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8"
    >
      <div className="h-4 w-36 rounded bg-muted" />
      <div className="mt-3 h-10 w-64 max-w-full rounded-lg bg-muted" />
      <div className="mt-3 h-5 w-80 max-w-full rounded bg-muted" />
      <div className="mt-6 flex gap-2">
        {Array.from({ length: 4 }, (_, index) => (
          <div className="h-11 w-24 shrink-0 rounded-full bg-muted" key={index} />
        ))}
      </div>
      <div className="mt-6 h-28 rounded-2xl bg-muted" />
      <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }, (_, index) => (
          <div className="space-y-3" key={index}>
            <div className="aspect-square rounded-xl bg-muted" />
            <div className="h-4 w-3/4 rounded bg-muted" />
            <div className="h-4 w-1/2 rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}
