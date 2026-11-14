import type { ProductStatus } from "@/generated/prisma/client";
import { StatusPill, type StatusTone } from "@/components/admin/status-pill";

const statusConfig: Record<ProductStatus, { label: string; tone: StatusTone }> =
  {
    DRAFT: { label: "Draft", tone: "refunded" },
    PUBLISHED: { label: "Published", tone: "delivered" },
    HIDDEN: { label: "Archived", tone: "archived" },
  };

export const productStatusLabel = (status: ProductStatus): string =>
  statusConfig[status].label;

export const productStatusChoices = (
  Object.keys(statusConfig) as ProductStatus[]
).map((value) => ({ value, label: statusConfig[value].label }));

export function ProductStatusBadge({
  status,
  className,
}: {
  status: ProductStatus;
  className?: string;
}) {
  const { label, tone } = statusConfig[status];
  return <StatusPill tone={tone} label={label} className={className} />;
}