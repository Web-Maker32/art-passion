export default function ProductLoading() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading product"
      className="mx-auto grid max-w-7xl animate-pulse gap-8 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:px-8"
    >
      <div className="aspect-square rounded-2xl bg-muted" />
      <div className="space-y-5">
        <div className="h-5 w-40 rounded bg-muted" />
        <div className="h-10 w-3/4 rounded bg-muted" />
        <div className="h-6 w-1/3 rounded bg-muted" />
        <div className="h-24 rounded bg-muted" />
        <div className="h-60 rounded-2xl bg-muted" />
      </div>
    </div>
  );
}
