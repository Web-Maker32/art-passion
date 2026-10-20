export default function SearchLoading() {
  return (
    <div
      aria-busy="true"
      aria-label="Searching products"
      className="skeleton-shimmer mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8"
    >
      <div className="h-9 w-64 rounded bg-muted" />
      <div className="mt-6 h-12 max-w-2xl rounded bg-muted" />
      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
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
