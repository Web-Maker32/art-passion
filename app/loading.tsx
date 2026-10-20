export default function StorefrontLoading() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading Art Passion"
      className="skeleton-shimmer mx-auto min-h-96 w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8"
    >
      <div className="h-10 max-w-xl rounded bg-muted" />
      <div className="mt-4 h-5 max-w-2xl rounded bg-muted" />
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
