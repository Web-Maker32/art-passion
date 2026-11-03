import type { ProductStatus } from "@/generated/prisma/client";
import { Badge } from "@/components/ui/badge";

const statusConfig: Record<
  ProductStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  DRAFT: { label: "Draft", variant: "outline" },
  PUBLISHED: { label: "Published", variant: "secondary" },
  HIDDEN: { label: "Archived", variant: "destructive" },
};

export const productStatusLabel = (status: ProductStatus): string =>
  statusConfig[status].label;

export const productStatusChoices = (
  Object.keys(statusConfig) as ProductStatus[]
).map((value) => ({ value, label: statusConfig[value].label }));

export function ProductStatusBadge({ status }: { status: ProductStatus }) {
  const { label, variant } = statusConfig[status];
  return <Badge variant={variant}>{label}</Badge>;
}
