import type { OrderStatus } from "@/generated/prisma/client";
import { StatusPill, type StatusTone } from "@/components/admin/status-pill";

const statusConfig: Record<OrderStatus, { label: string; tone: StatusTone }> = {
  PENDING: { label: "Pending", tone: "pending" },
  PAID: { label: "Paid", tone: "paid" },
  PROCESSING: { label: "Processing", tone: "processing" },
  SHIPPED: { label: "Shipped", tone: "shipped" },
  DELIVERED: { label: "Delivered", tone: "delivered" },
  CANCELLED: { label: "Cancelled", tone: "cancelled" },
  REFUNDED: { label: "Refunded", tone: "refunded" },
};

export const orderStatusLabel = (status: OrderStatus): string =>
  statusConfig[status].label;

export const orderStatusChoices = (
  Object.keys(statusConfig) as OrderStatus[]
).map((value) => ({ value, label: statusConfig[value].label }));

export function OrderStatusBadge({
  status,
  className,
}: {
  status: OrderStatus;
  className?: string;
}) {
  const { label, tone } = statusConfig[status];
  return <StatusPill tone={tone} label={label} className={className} />;
}