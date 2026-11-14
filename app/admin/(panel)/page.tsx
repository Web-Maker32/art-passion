import Link from "next/link";
import { io } from "next/cache";
import {
  AlertCircle,
  Banknote,
  CalendarDays,
  CheckCircle2,
  Clock,
  PackageSearch,
  PackageX,
  Receipt,
  ShoppingBag,
  TrendingUp,
  Truck,
} from "lucide-react";
import { requireAdmin } from "@/lib/admin-auth";
import { getAdminDashboard } from "@/lib/queries/admin-dashboard";
import { formatPrice } from "@/lib/format";
import { formatKarachiDateTime } from "@/lib/admin-datetime";
import { formatRelativeTime } from "@/lib/admin-display";
import { buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { OrderStatusBadge } from "@/components/admin/order-status-badge";
import { OrdersChart } from "@/components/admin/orders-chart";
import { StatCard } from "@/components/admin/stat-card";
import { Chip } from "@/components/admin/chip";
import { SectionCard } from "@/components/admin/admin-cards";
import { AdminEmptyState } from "@/components/admin/admin-empty-state";

// cacheComponents: requireAdmin() reads the session cookie and the dashboard
// reads live order data. Render this page at request time.
export const instant = false;

type SearchParams = Promise<{ showCancelled?: string | string[] }>;

function firstString(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireAdmin();
  await io();
  const params = await searchParams;
  const showCancelled = firstString(params.showCancelled) === "1";
  const dashboard = await getAdminDashboard(new Date(), {
    includeCancelled: showCancelled,
  });
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
        <h2 id="attention-heading" className="text-base font-semibold">
          Needs attention
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={Clock}
            label="Pending payment"
            value={attention.pending}
            tone={attention.pending > 0 ? "gold" : "default"}
            hint={
              attention.pendingPaymentReported > 0 ? (
                <Chip tone="gold">
                  {attention.pendingPaymentReported} payment reported
                </Chip>
              ) : (
                "No payment reports yet on pending orders."
              )
            }
            href="/admin/orders?status=PENDING"
          />
          <StatCard
            icon={Truck}
            label="Awaiting shipment"
            value={attention.awaitingShipment}
            hint="PAID or PROCESSING orders to pack and dispatch."
            href="/admin/orders?status=PAID"
          />
          <StatCard
            icon={PackageSearch}
            label="Low stock"
            value={attention.lowStock}
            hint="Variants with 1–2 left (made-to-order excluded)."
            href="/admin/products?stock=low"
          />
          <StatCard
            icon={PackageX}
            label="Out of stock"
            value={attention.outOfStock}
            tone={attention.outOfStock > 0 ? "danger" : "default"}
            hint="Variants at zero — restock or archive them."
            href="/admin/products?stock=out"
          />
        </div>
      </section>

      <section aria-labelledby="numbers-heading" className="space-y-3">
        <h2 id="numbers-heading" className="text-base font-semibold">
          Orders and revenue
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            icon={ShoppingBag}
            label="Orders today"
            value={dashboard.ordersToday}
            hint="excluding cancelled"
          />
          <StatCard
            icon={CalendarDays}
            label="Orders, last 7 days"
            value={dashboard.orders7d}
            hint="excluding cancelled"
          />
          <StatCard
            icon={Banknote}
            label="Revenue today"
            value={formatPrice(revenue.today)}
          />
          <StatCard
            icon={TrendingUp}
            label="Revenue, last 7 days"
            value={formatPrice(revenue.week)}
          />
          <StatCard
            icon={Banknote}
            label="Revenue, last 30 days"
            value={formatPrice(revenue.month)}
            hint={`${revenue.monthCount} ${revenue.monthCount === 1 ? "order" : "orders"}`}
          />
          <StatCard
            icon={Receipt}
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

      <SectionCard
        title="Orders — last 14 days"
        description="Excluding cancelled and refunded orders."
      >
        <OrdersChart buckets={dashboard.chart} />
      </SectionCard>

      <SectionCard
        title="Latest orders"
        flush
        actions={
          <>
            <Link
              className="text-muted-foreground hover:text-foreground inline-flex min-h-11 items-center rounded-sm text-[13px] font-medium underline-offset-4 transition-colors hover:underline sm:min-h-0"
              href={showCancelled ? "/admin" : "/admin?showCancelled=1"}
            >
              {showCancelled ? "Hide cancelled" : "Show cancelled"}
            </Link>
            <Link
              className={buttonVariants({ variant: "outline", size: "sm" })}
              href="/admin/orders"
            >
              View all orders
            </Link>
          </>
        }
      >
        {dashboard.latestOrders.length === 0 ? (
          <AdminEmptyState
            icon={ShoppingBag}
            title="No orders yet"
            description="They will appear here as soon as customers checkout."
          />
        ) : (
          <>
            <ul className="divide-y sm:hidden">
              {dashboard.latestOrders.map((order) => {
                const dimmed =
                  order.status === "CANCELLED" || order.status === "REFUNDED";
                return (
                  <li
                    className={dimmed ? "opacity-60" : undefined}
                    key={order.orderNumber}
                  >
                    <Link
                      className="block px-4 py-3"
                      href={`/admin/orders/${order.orderNumber}`}
                    >
                      <span className="flex items-center justify-between gap-3">
                        <span className="font-semibold">
                          {order.orderNumber}
                        </span>
                        <OrderStatusBadge status={order.status} />
                      </span>
                      <span className="mt-1 flex items-center justify-between gap-3 text-sm">
                        <span className="text-muted-foreground truncate">
                          {order.customerName}
                        </span>
                        <span className="font-semibold tabular-nums">
                          {formatPrice(order.total)}
                        </span>
                      </span>
                      <span
                        className="text-muted-foreground mt-0.5 block text-xs"
                        title={formatKarachiDateTime(order.createdAt)}
                      >
                        {formatRelativeTime(order.createdAt)}
                        <span className="sr-only">
                          {" "}
                          — {formatKarachiDateTime(order.createdAt)}
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
            <div className="hidden sm:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Placed</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dashboard.latestOrders.map((order) => {
                    const dimmed =
                      order.status === "CANCELLED" ||
                      order.status === "REFUNDED";
                    return (
                      <TableRow
                        className={dimmed ? "opacity-60" : undefined}
                        key={order.orderNumber}
                      >
                        <TableCell>
                          <Link
                            className="font-semibold underline-offset-4 hover:underline"
                            href={`/admin/orders/${order.orderNumber}`}
                          >
                            {order.orderNumber}
                          </Link>
                        </TableCell>
                        <TableCell className="max-w-48">
                          <span
                            className="block truncate"
                            title={order.customerName}
                          >
                            {order.customerName}
                          </span>
                        </TableCell>
                        <TableCell>
                          <OrderStatusBadge status={order.status} />
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatPrice(order.total)}
                        </TableCell>
                        <TableCell
                          className="text-muted-foreground text-right text-xs"
                          title={formatKarachiDateTime(order.createdAt)}
                        >
                          {formatRelativeTime(order.createdAt)}
                          <span className="sr-only">
                            {" "}
                            — {formatKarachiDateTime(order.createdAt)}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </SectionCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard
          title="Low stock"
          description="2 or fewer left (made-to-order excluded)"
          flush
        >
          {dashboard.lowStockVariants.length === 0 ? (
            <AdminEmptyState
              className="py-8"
              icon={PackageSearch}
              title="Nothing is running low"
              description="Stock levels look healthy. Nice."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead className="text-right">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dashboard.lowStockVariants.map((variant) => (
                  <TableRow key={variant.variantId}>
                    <TableCell className="max-w-56">
                      <span
                        className="block truncate font-medium"
                        title={variant.productTitle}
                      >
                        {variant.productTitle}
                      </span>
                      <span className="text-muted-foreground block truncate text-xs">
                        {variant.variantLabel}
                      </span>
                    </TableCell>
                    <TableCell
                      className={`text-right font-semibold ${
                        variant.stock === 0
                          ? "text-status-cancelled"
                          : "text-status-pending"
                      }`}
                    >
                      {variant.stock} left
                    </TableCell>
                    <TableCell className="text-right">
                      <Link
                        className={buttonVariants({
                          variant: "outline",
                          size: "xs",
                        })}
                        href={`/admin/products/${variant.productId}`}
                      >
                        Edit
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </SectionCard>

        <SectionCard
          title="Top products"
          description="Units sold, last 30 days · revenue statuses only"
          flush
        >
          {dashboard.topProducts.length === 0 ? (
            <AdminEmptyState
              className="py-8"
              icon={TrendingUp}
              title="No sales yet"
              description="No sales in the last 30 days."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Units</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dashboard.topProducts.map((product, index) => (
                  <TableRow key={product.productTitle}>
                    <TableCell>
                      <span
                        aria-hidden="true"
                        className="bg-muted text-muted-foreground flex size-6 items-center justify-center rounded-full text-xs font-semibold"
                      >
                        {index + 1}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-56">
                      <span
                        className="block truncate font-medium"
                        title={product.productTitle}
                      >
                        {product.productTitle}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-right">
                      {product.units} {product.units === 1 ? "unit" : "units"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </SectionCard>
      </div>

      <SectionCard
        title="Launch checklist"
        description={`${checklistDone} of ${dashboard.checklist.length} ready`}
      >
        <ul className="grid gap-2 sm:grid-cols-2">
          {dashboard.checklist.map((item) => (
            <li key={item.id} className="flex items-start gap-3 text-sm">
              {item.done ? (
                <CheckCircle2
                  aria-hidden="true"
                  className="text-status-delivered mt-0.5 size-4 shrink-0"
                />
              ) : (
                <AlertCircle
                  aria-hidden="true"
                  className="text-gold-text dark:text-gold-light mt-0.5 size-4 shrink-0"
                />
              )}
              <span className="min-w-0">
                {item.label}
                <span className="sr-only">
                  {item.done ? " — done" : " — still to do"}
                </span>
                {!item.done &&
                  (item.id === "samples" ? (
                    <Link
                      className="text-gold-text dark:text-gold-light inline-flex min-h-11 items-center font-medium underline-offset-4 hover:underline sm:ml-2 sm:min-h-0"
                      href="/admin/products?search=Sample%3A"
                    >
                      Review samples
                    </Link>
                  ) : (
                    <span className="text-muted-foreground block text-xs sm:ml-2 sm:inline">
                      {item.id === "content"
                        ? "Finalise in site content"
                        : "Set in environment config"}
                    </span>
                  ))}
              </span>
            </li>
          ))}
        </ul>
        {dashboard.draftCount > 0 && (
          <p className="text-muted-foreground mt-3 text-xs">
            You also have {dashboard.draftCount}{" "}
            {dashboard.draftCount === 1 ? "draft product" : "draft products"}{" "}
            not yet published.{" "}
            <Link
              className="font-medium underline-offset-4 hover:underline"
              href="/admin/products?status=DRAFT"
            >
              View drafts
            </Link>
          </p>
        )}
      </SectionCard>
    </div>
  );
}