import type { OrderStatus } from "@/generated/prisma/client";
import { Badge } from "@/components/ui/badge";

const statusConfig: Record<
  OrderStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  PENDING: { label: "Pending", variant: "outline" },
  PAID: { label: "Paid", variant: "secondary" },
  SHIPPED: { label: "Shipped", variant: "default" },
  DELIVERED: { label: "Delivered", variant: "secondary" },
  CANCELLED: { label: "Cancelled", variant: "destructive" },
  REFUNDED: { label: "Refunded", variant: "outline" },
};

export const orderStatusLabel = (status: OrderStatus): string =>
  statusConfig[status].label;

export const orderStatusChoices = (
  Object.keys(statusConfig) as OrderStatus[]
).map((value) => ({ value, label: statusConfig[value].label }));

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const { label, variant } = statusConfig[status];
  return <Badge variant={variant}>{label}</Badge>;
}
