"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import {
  Check,
  ChevronRight,
  Copy,
  Image as ImageIcon,
  Printer,
  ShoppingBag,
} from "lucide-react";
import { cn } from "cn";
import type { OrderStatus } from "@/generated/prisma/client";
import type { AdminOrderListRow } from "@/lib/queries/admin-orders";
import { formatKarachiDateTime } from "@/lib/admin-datetime";
import {
  avatarTintClass,
  customerInitials,
  formatRelativeTime,
  orderProgressStep,
} from "@/lib/admin-display";
import { formatPrice } from "@/lib/format";
import { OrderStatusBadge } from "@/components/admin/order-status-badge";
import { Chip } from "@/components/admin/chip";
import { TableCard } from "@/components/admin/admin-cards";
import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { IconButton, IconButtonLink } from "@/components/admin/icon-button";
import { buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function CopyOrderNumber({ orderNumber }: { orderNumber: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  return (
    <IconButton
      className="size-8 opacity-0 transition-opacity group-focus-within/row:opacity-100 group-hover/row:opacity-100 focus-visible:opacity-100 motion-reduce:transition-none"
      label={copied ? "Order number copied" : `Copy order number ${orderNumber}`}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(orderNumber);
          setCopied(true);
          window.clearTimeout(timer.current);
          timer.current = window.setTimeout(() => setCopied(false), 1500);
        } catch {
          // Clipboard unavailable — the number stays selectable as text.
        }
      }}
    >
      {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
    </IconButton>
  );
}

/** Four dots for live orders; cancelled/refunded orders show none. */
function OrderProgress({ status }: { status: OrderStatus }) {
  const step = orderProgressStep(status);
  if (step === null) return null;
  return (
    <span
      aria-label={`Progress: ${step} of 4 steps complete`}
      className="flex items-center gap-1"
      role="img"
    >
      {[1, 2, 3, 4].map((dot) => (
        <span
          aria-hidden="true"
          className={cn(
            "size-1.5 rounded-full",
            dot <= step ? "bg-status-shipped" : "bg-border",
          )}
          key={dot}
        />
      ))}
    </span>
  );
}

function OrderItems({ order }: { order: AdminOrderListRow }) {
  if (order.itemCount === 0) {
    return <span className="text-muted-foreground text-xs">No items</span>;
  }
  const names = order.items.map((item) => item.productTitle).join(", ");
  const label =
    order.extraItemCount > 0
      ? `${names} and ${order.extraItemCount} more`
      : names;
  return (
    <span
      aria-label={label}
      className="flex items-center -space-x-2"
      role="img"
      title={label}
    >
      {order.items.map((item, index) => {
        const url = item.thumbnail?.url;
        const usable = url && !url.startsWith("https://placehold.co/");
        return usable ? (
          <span
            className="ring-card bg-muted relative size-7 overflow-hidden rounded-full ring-2"
            key={index}
          >
            <Image
              alt=""
              className="object-cover"
              height={28}
              src={url}
              width={28}
            />
          </span>
        ) : (
          <span
            className="ring-card bg-muted text-muted-foreground relative grid size-7 place-items-center rounded-full ring-2"
            key={index}
          >
            <ImageIcon aria-hidden="true" className="size-3.5" />
          </span>
        );
      })}
      {order.extraItemCount > 0 && (
        <span className="ring-card bg-muted text-muted-foreground relative grid size-7 place-items-center rounded-full text-[10px] font-semibold ring-2">
          +{order.extraItemCount}
        </span>
      )}
    </span>
  );
}

function CustomerAvatar({ name }: { name: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid size-8 shrink-0 place-items-center rounded-full text-xs font-semibold",
        avatarTintClass(name),
      )}
    >
      {customerInitials(name)}
    </span>
  );
}

function StatusChips({ order }: { order: AdminOrderListRow }) {
  if (order.status === "CANCELLED" || order.status === "REFUNDED") return null;
  return (
    <>
      {order.status === "PENDING" && order.paymentReportedAt && (
        <Chip tone="gold">Payment reported</Chip>
      )}
      {(order.status === "PAID" || order.status === "PROCESSING") && (
        <Chip tone="teal">To ship</Chip>
      )}
    </>
  );
}

function PlacedTime({ createdAt }: { createdAt: Date }) {
  const exact = formatKarachiDateTime(createdAt);
  return (
    <span className="text-muted-foreground text-xs" title={exact}>
      {formatRelativeTime(createdAt)}
      <span className="sr-only"> — {exact}</span>
    </span>
  );
}

export function AdminOrdersTable({ orders }: { orders: AdminOrderListRow[] }) {
  const router = useRouter();

  if (orders.length === 0) {
    return (
      <TableCard>
        <AdminEmptyState
          action={
            <Link
              className={buttonVariants({ variant: "outline" })}
              href="/admin/orders"
            >
              Reset filters
            </Link>
          }
          description="Try a different search, or reset to see active orders."
          icon={ShoppingBag}
          title="No orders match these filters"
        />
      </TableCard>
    );
  }

  function onRowClick(event: MouseEvent<HTMLTableRowElement>, href: string) {
    const target = event.target as HTMLElement;
    if (target.closest("a, button, input, summary, details, label")) return;
    router.push(href);
  }

  return (
    <>
      {/* Desktop / tablet table */}
      <TableCard className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Items</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Placed</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => {
              const href = `/admin/orders/${order.orderNumber}`;
              const dimmed =
                order.status === "CANCELLED" || order.status === "REFUNDED";
              return (
                <TableRow
                  className={cn(
                    "group/row h-16 cursor-pointer",
                    dimmed && "opacity-60",
                  )}
                  key={order.id}
                  onClick={(event) => onRowClick(event, href)}
                >
                  <TableCell>
                    <span className="flex flex-col">
                      <span className="flex items-center gap-1">
                        <Link
                          className="font-semibold underline-offset-4 hover:underline"
                          href={href}
                        >
                          {order.orderNumber}
                        </Link>
                        <CopyOrderNumber orderNumber={order.orderNumber} />
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {order.itemCount}{" "}
                        {order.itemCount === 1 ? "item" : "items"}
                      </span>
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="flex items-center gap-3">
                      <CustomerAvatar name={order.customerName} />
                      <span className="min-w-0">
                        <span
                          className="block max-w-40 truncate font-semibold"
                          title={order.customerName}
                        >
                          {order.customerName}
                        </span>
                        <span className="text-muted-foreground block text-xs">
                          {order.customerPhone}
                        </span>
                      </span>
                    </span>
                  </TableCell>
                  <TableCell>
                    <OrderItems order={order} />
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="block font-semibold">
                      {formatPrice(order.total)}
                    </span>
                    {order.shipping > 0 && (
                      <span className="text-muted-foreground block text-xs font-normal">
                        incl. {formatPrice(order.shipping)} delivery
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <PlacedTime createdAt={order.createdAt} />
                  </TableCell>
                  <TableCell className="py-2">
                    <span className="flex flex-col items-start gap-1">
                      <span className="flex items-center gap-2">
                        <OrderStatusBadge status={order.status} />
                        {!dimmed && <OrderProgress status={order.status} />}
                      </span>
                      <StatusChips order={order} />
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="flex items-center justify-end gap-0.5">
                      <IconButtonLink
                        className="size-9 opacity-0 transition-opacity group-focus-within/row:opacity-100 group-hover/row:opacity-100 focus-visible:opacity-100 motion-reduce:transition-none"
                        href={`${href}/print`}
                        label={`Print packing slip for ${order.orderNumber}`}
                        target="_blank"
                      >
                        <Printer aria-hidden="true" />
                      </IconButtonLink>
                      <ChevronRight
                        aria-hidden="true"
                        className="text-muted-foreground size-4"
                      />
                    </span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableCard>

      {/* Mobile cards */}
      <ul className="space-y-3 md:hidden">
        {orders.map((order) => {
          const href = `/admin/orders/${order.orderNumber}`;
          const dimmed =
            order.status === "CANCELLED" || order.status === "REFUNDED";
          return (
            <li
              className={cn(
                "bg-card rounded-[12px] border p-4",
                dimmed && "opacity-60",
              )}
              key={order.id}
            >
              <div className="flex items-start justify-between gap-3">
                <span className="flex min-w-0 items-center gap-1">
                  <Link
                    className="truncate font-semibold underline-offset-4 hover:underline"
                    href={href}
                  >
                    {order.orderNumber}
                  </Link>
                  <CopyOrderNumber orderNumber={order.orderNumber} />
                </span>
                <OrderStatusBadge status={order.status} />
              </div>
              <div className="mt-3 flex items-center gap-3">
                <CustomerAvatar name={order.customerName} />
                <span className="min-w-0">
                  <span
                    className="block truncate font-semibold"
                    title={order.customerName}
                  >
                    {order.customerName}
                  </span>
                  <span className="text-muted-foreground block text-xs">
                    {order.customerPhone}
                  </span>
                </span>
                <span className="ml-auto text-right">
                  <span className="block font-semibold tabular-nums">
                    {formatPrice(order.total)}
                  </span>
                  {order.shipping > 0 && (
                    <span className="text-muted-foreground block text-xs">
                      incl. {formatPrice(order.shipping)} delivery
                    </span>
                  )}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <OrderItems order={order} />
                <span className="text-muted-foreground text-xs">
                  {order.itemCount} {order.itemCount === 1 ? "item" : "items"}
                </span>
                {!dimmed && <OrderProgress status={order.status} />}
                <StatusChips order={order} />
              </div>
              <div className="mt-3 flex items-center justify-between gap-3 border-t pt-3">
                <PlacedTime createdAt={order.createdAt} />
                <span className="flex items-center gap-1">
                  <IconButtonLink
                    className="size-11"
                    href={`${href}/print`}
                    label={`Print packing slip for ${order.orderNumber}`}
                    target="_blank"
                  >
                    <Printer aria-hidden="true" />
                  </IconButtonLink>
                  <Link
                    aria-label={`Open order ${order.orderNumber}`}
                    className={buttonVariants({
                      variant: "ghost",
                      size: "icon-sm",
                      className: "text-muted-foreground hover:text-foreground",
                    })}
                    href={href}
                  >
                    <ChevronRight aria-hidden="true" />
                  </Link>
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}