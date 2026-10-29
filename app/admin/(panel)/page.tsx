import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { getAdminDashboardStats } from "@/lib/queries/admin-orders";
import { formatPrice } from "@/lib/format";
import { buttonVariants } from "@/components/ui/button";

// cacheComponents: requireAdmin() reads the session cookie and evaluates
// Date.now(), which blocks prerendering. Render this page at request time.
export const instant = false;

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="border-silver bg-card rounded-xl border p-5">
      <p className="text-muted-foreground text-sm font-medium">{label}</p>
      <p className="font-heading mt-2 text-3xl font-bold">{value}</p>
      {hint && <p className="text-muted-foreground mt-1 text-xs">{hint}</p>}
    </div>
  );
}

export default async function AdminDashboardPage() {
  await requireAdmin();
  const stats = await getAdminDashboardStats();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold sm:text-3xl">
            Dashboard
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            A snapshot of your orders.
          </p>
        </div>
        <Link
          className={buttonVariants({ variant: "outline" })}
          href="/admin/orders"
        >
          View all orders
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Pending" value={String(stats.pending)} hint="Awaiting payment" />
        <StatCard label="Paid" value={String(stats.paid)} hint="Ready to ship" />
        <StatCard label="Shipped" value={String(stats.shipped)} hint="On the way" />
        <StatCard label="Today's orders" value={String(stats.today)} hint="Asia/Karachi" />
        <StatCard
          label="Paid this month"
          value={formatPrice(stats.paidThisMonthTotal)}
          hint={`${stats.paidThisMonthCount} paid ${stats.paidThisMonthCount === 1 ? "order" : "orders"} (PAID, SHIPPED or DELIVERED)`}
        />
      </div>
    </div>
  );
}
