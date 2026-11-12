export default function CartLoading() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading cart"
      className="skeleton-shimmer mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8"
    >
      <div className="h-10 w-48 rounded-lg bg-muted" />
      <div className="mt-3 h-5 w-20 rounded bg-muted" />
      <div className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-4">
          {Array.from({ length: 2 }, (_, index) => (
            <div
              className="grid gap-4 rounded-2xl border border-silver bg-card p-4 sm:grid-cols-[7rem_minmax(0,1fr)] sm:p-5"
              key={index}
            >
              <div className="aspect-square rounded-xl bg-muted" />
              <div className="space-y-3">
                <div className="h-6 w-2/3 rounded bg-muted" />
                <div className="h-4 w-1/3 rounded bg-muted" />
                <div className="h-11 w-40 rounded-lg bg-muted" />
              </div>
            </div>
          ))}
        </div>
        <div className="space-y-4 rounded-2xl border border-silver bg-card p-5">
          <div className="h-6 w-32 rounded bg-muted" />
          <div className="h-16 rounded-xl bg-muted" />
          <div className="h-4 w-full rounded bg-muted" />
          <div className="h-4 w-full rounded bg-muted" />
          <div className="h-12 rounded-lg bg-muted" />
        </div>
      </div>
    </div>
  );
}