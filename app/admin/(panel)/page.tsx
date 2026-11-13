import Link from "next/link";
import { io } from "next/cache";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { requireAdmin } from "@/lib/admin-auth";
import { getAdminDashboard } from "@/lib/queries/admin-dashboard";
import { formatPrice } from "@/lib/format";
import { formatKarachiDateTime } from "@/lib/admin-datetime";
import { buttonVariants } from "@/components/ui/button";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { OrderStatusBadge } from "@/components/admin/order-status-badge";
import { OrdersChart } from "@/components/admin/orders-chart";

// cacheComponents: requireAdmin() reads the session cookie and the dashboard
// reads live order data. Render this page at request time.
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
      <p className="font-heading mt-2 text-3xl font-bold break-words">
        {value}
      </p>
      {hint && <p className="text-muted-foreground mt-1 text-xs">{hint}</p>}
    </div>
  );
}

function AttentionTile({
  label,
  value,
  hint,
  href,
  urgent = false,
}: {
  label: string;
  value: number;
  hint: string;
  href: string;
  urgent?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`bg-card lift-sm block rounded-xl border p-5 ${
        urgent ? "border-gold" : "border-silver"
      }`}
    >
      <p className="text-muted-foreground text-sm font-medium">{label}</p>
      <p
        className={`font-heading mt-2 text-3xl font-bold ${
          urgent && value > 0 ? "text-gold-text dark:text-gold-light" : ""
        }`}
      >
        {value}
      </p>
      <p className="text-muted-foreground mt-1 text-xs leading-5">{hint}</p>
    </Link>
  );
}

export default async function AdminDashboardPage() {
  await requireAdmin();
  await io();
  const dashboard = await getAdminDashboard();
  const { attention, revenue } = dashboard;
  const checklistDone = dashboard.checklist.filter((item) => item.done).length;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Dashboard"
        description="Your shop at a glance. All times and day boundaries use Asia/Karachi."
        actions={
          <>
            <Link className={buttonVariants()} href="/admin/products/new">
              + New product
            </Link>
            <Link
              className={buttonVariants({ variant: "outline" })}
              href="/"
              target="_blank"
              rel="noopener noreferrer"
            >
              View store
            </Link>
          </>
        }
      />

      <section aria-labelledby="attention-heading" className="space-y-3">
        <h2
          id="attention-heading"
          className="font-heading text-lg font-semibold"
        >
          Needs attention
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <AttentionTile
            label="Pending payment"
            value={attention.pending}
            hint={
              attention.pendingPaymentReported > 0
                ? `${attention.pendingPaymentReported} with a reported transaction ID — check these first.`
                : "No payment reports yet on pending orders."
            }
            href="/admin/orders?status=PENDING"
            urgent={attention.pendingPaymentReported > 0}
          />
          <AttentionTile
            label="Awaiting shipment"
            value={attention.awaitingShipment}
            hint="PAID or PROCESSING orders to pack and dispatch."
            href="/admin/orders?status=PAID"
          />
          <AttentionTile
            label="Low stock"
            value={attention.lowStock}
            hint="Variants with 1–2 left (made-to-order excluded)."
            href="/admin/products"
          />
          <AttentionTile
            label="Out of stock"
            value={attention.outOfStock}
            hint="Variants at zero — restock or hide them."
            href="/admin/products"
            urgent={attention.outOfStock > 0}
          />
        </div>
      </section>

      <section aria-labelledby="numbers-heading" className="space-y-3">
        <h2 id="numbers-heading" className="font-heading text-lg font-semibold">
          Orders and revenue
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            label="Orders today"
            value={String(dashboard.ordersToday)}
          />
          <StatCard
            label="Orders, last 7 days"
            value={String(dashboard.orders7d)}
          />
          <StatCard label="Revenue today" value={formatPrice(revenue.today)} />
          <StatCard
            label="Revenue, last 7 days"
            value={formatPrice(revenue.week)}
          />
          <StatCard
            label="Revenue, last 30 days"
            value={formatPrice(revenue.month)}
            hint={`${revenue.monthCount} ${revenue.monthCount === 1 ? "order" : "orders"}`}
          />
          <StatCard
            label="Average order, last 30 days"
            value={formatPrice(revenue.aov30d)}
          />
        </div>
        <p className="text-muted-foreground text-xs leading-5">
          Revenue counts orders currently PAID, PROCESSING, SHIPPED or
          DELIVERED, grouped by order date. Pending, cancelled and refunded
          orders are excluded. Windows include today.
        </p>
      </section>

      <section
        aria-labelledby="chart-heading"
        className="border-silver bg-card rounded-xl border p-5"
      >
        <h2 id="chart-heading" className="font-heading text-lg font-semibold">
          Orders — last 14 days
        </h2>
        <div className="mt-4">
          <OrdersChart buckets={dashboard.chart} />
        </div>
      </section>

      <section
        aria-labelledby="latest-orders-heading"
        className="border-silver bg-card rounded-xl border p-5"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2
            id="latest-orders-heading"
            className="font-heading text-lg font-semibold"
          >
            Latest orders
          </h2>
          <Link
            className={buttonVariants({ variant: "outline", size: "sm" })}
            href="/admin/orders"
          >
            View all orders
          </Link>
        </div>
        {dashboard.latestOrders.length === 0 ? (
          <p className="text-muted-foreground mt-3 text-sm">
            No orders yet. They will appear here as soon as customers checkout.
          </p>
        ) : (
          <ul className="divide-border mt-3 divide-y">
            {dashboard.latestOrders.map((order) => (
              <li key={order.orderNumber}>
                <Link
                  href={`/admin/orders/${order.orderNumber}`}
                  className="hover-fine:hover:bg-muted flex min-h-12 flex-wrap items-center gap-x-4 gap-y-1 rounded-lg px-3 py-3"
                >
                  <span className="font-medium">{order.orderNumber}</span>
                  <OrderStatusBadge status={order.status} />
                  <span className="text-muted-foreground text-sm">
                    {order.customerFirstName || "Customer"}
                  </span>
                  <span className="ml-auto font-semibold">
                    {formatPrice(order.total)}
                  </span>
                  <span className="text-muted-foreground w-full text-xs sm:w-auto">
                    {formatKarachiDateTime(order.createdAt)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section
          aria-labelledby="low-stock-heading"
          className="border-silver bg-card rounded-xl border p-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2
              id="low-stock-heading"
              className="font-heading text-lg font-semibold"
            >
              Low stock
            </h2>
            <span className="text-muted-foreground text-xs">
              2 or fewer left (made-to-order excluded)
            </span>
          </div>
          {dashboard.lowStockVariants.length === 0 ? (
            <p className="text-muted-foreground mt-3 text-sm">
              Nothing is running low. Nice.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {dashboard.lowStockVariants.map((variant) => (
                <li
                  className="flex flex-wrap items-center justify-between gap-2 text-sm"
                  key={variant.variantId}
                >
                  <span className="min-w-0">
                    <span className="font-medium">{variant.productTitle}</span>
                    <span className="text-muted-foreground">
                      {" "}
                      — {variant.variantLabel}
                    </span>
                  </span>
                  <span className="flex items-center gap-3">
                    <span
                      className={
                        variant.stock === 0
                          ? "text-destructive font-semibold"
                          : "font-semibold"
                      }
                    >
                      {variant.stock} left
                    </span>
                    <Link
                      className={buttonVariants({
                        variant: "outline",
                        size: "sm",
                      })}
                      href={`/admin/products/${variant.productId}`}
                    >
                      Edit
                    </Link>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section
          aria-labelledby="top-products-heading"
          className="border-silver bg-card rounded-xl border p-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2
              id="top-products-heading"
              className="font-heading text-lg font-semibold"
            >
              Top products
            </h2>
            <span className="text-muted-foreground text-xs">
              Units sold, last 30 days
            </span>
          </div>
          {dashboard.topProducts.length === 0 ? (
            <p className="text-muted-foreground mt-3 text-sm">
              No sales in the last 30 days yet.
            </p>
          ) : (
            <ol className="mt-3 space-y-2">
              {dashboard.topProducts.map((product, index) => (
                <li
                  key={product.productTitle}
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span
                      aria-hidden="true"
                      className="bg-accent text-accent-foreground flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
                    >
                      {index + 1}
                    </span>
                    <span className="font-medium break-words">
                      {product.productTitle}
                    </span>
                  </span>
                  <span className="text-muted-foreground shrink-0">
                    {product.units} {product.units === 1 ? "unit" : "units"}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>

      <section
        aria-labelledby="checklist-heading"
        className="border-silver bg-card rounded-xl border p-5"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2
            id="checklist-heading"
            className="font-heading text-lg font-semibold"
          >
            Launch checklist
          </h2>
          <span className="text-muted-foreground text-xs">
            {checklistDone} of {dashboard.checklist.length} ready
          </span>
        </div>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {dashboard.checklist.map((item) => (
            <li key={item.id} className="flex items-start gap-3 text-sm">
              {item.done ? (
                <CheckCircle2
                  aria-hidden="true"
                  className="text-success mt-0.5 size-4 shrink-0"
                />
              ) : (
                <AlertCircle
                  aria-hidden="true"
                  className="text-gold-text dark:text-gold-light mt-0.5 size-4 shrink-0"
                />
              )}
              <span>
                {item.label}
                <span className="sr-only">
                  {item.done ? " — done" : " — still to do"}
                </span>
              </span>
            </li>
          ))}
        </ul>
        {dashboard.draftCount > 0 && (
          <p className="text-muted-foreground mt-3 text-xs">
            You also have {dashboard.draftCount}{" "}
            {dashboard.draftCount === 1 ? "draft product" : "draft products"}{" "}
            not yet published.
          </p>
        )}
      </section>
    </div>
  );
}
