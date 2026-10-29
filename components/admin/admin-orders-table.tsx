import Link from "next/link";
import type { AdminOrderListRow } from "@/lib/queries/admin-orders";
import { formatKarachiDate } from "@/lib/admin-datetime";
import { formatPrice } from "@/lib/format";
import { OrderStatusBadge } from "@/components/admin/order-status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const rowLinkClass =
  "font-semibold text-foreground underline-offset-4 hover-fine:hover:underline focus-visible:outline-ring focus-visible:outline-2 focus-visible:outline-offset-2";

export function AdminOrdersTable({ orders }: { orders: AdminOrderListRow[] }) {
  if (orders.length === 0) {
    return (
      <p className="border-silver bg-card text-muted-foreground rounded-xl border p-6 text-center text-sm">
        No orders match these filters.
      </p>
    );
  }

  return (
    <>
      {/* Desktop / tablet table */}
      <div className="border-silver bg-card hidden rounded-xl border md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell>
                  <Link
                    className={rowLinkClass}
                    href={`/admin/orders/${order.orderNumber}`}
                  >
                    {order.orderNumber}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatKarachiDate(order.createdAt)}
                </TableCell>
                <TableCell>{order.customerName}</TableCell>
                <TableCell className="text-muted-foreground">
                  {order.customerPhone}
                </TableCell>
                <TableCell className="text-right font-semibold">
                  {formatPrice(order.total)}
                </TableCell>
                <TableCell>
                  <OrderStatusBadge status={order.status} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile cards */}
      <ul className="space-y-3 md:hidden">
        {orders.map((order) => (
          <li
            className="border-silver bg-card rounded-xl border p-4"
            key={order.id}
          >
            <div className="flex items-start justify-between gap-3">
              <Link
                className={rowLinkClass}
                href={`/admin/orders/${order.orderNumber}`}
              >
                {order.orderNumber}
              </Link>
              <OrderStatusBadge status={order.status} />
            </div>
            <dl className="text-muted-foreground mt-3 space-y-1 text-sm">
              <div className="flex justify-between gap-3">
                <dt>Customer</dt>
                <dd className="text-foreground text-right">
                  {order.customerName}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt>Phone</dt>
                <dd className="text-right">{order.customerPhone}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt>Date</dt>
                <dd className="text-right">
                  {formatKarachiDate(order.createdAt)}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt>Total</dt>
                <dd className="text-foreground text-right font-semibold">
                  {formatPrice(order.total)}
                </dd>
              </div>
            </dl>
          </li>
        ))}
      </ul>
    </>
  );
}
