import {
  AdminStatCardSkeleton,
  AdminTableSkeleton,
} from "@/components/admin/admin-skeleton";

/** Streaming fallback for admin panel pages while live data is read. */
export default function AdminPanelLoading() {
  return (
    <div aria-busy="true" className="space-y-6">
      <div className="skeleton-shimmer space-y-2">
        <div className="bg-muted h-7 w-48 rounded-md" />
        <div className="bg-muted h-4 w-72 max-w-full rounded-full" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <AdminStatCardSkeleton key={index} />
        ))}
      </div>
      <AdminTableSkeleton rows={6} />
    </div>
  );
}