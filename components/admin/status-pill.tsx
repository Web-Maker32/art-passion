import { cn } from "cn";

/**
 * Shared admin status pill: a small dot plus a tinted background. Text and
 * dot use the mode-aware --status-* tokens (AA on their 12% tint), so the
 * same markup reads correctly in light and dark mode.
 */
export type StatusTone =
  | "pending"
  | "paid"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded"
  | "archived";

const toneClasses: Record<StatusTone, string> = {
  pending: "border-status-pending/30 bg-status-pending/12 text-status-pending",
  paid: "border-status-paid/30 bg-status-paid/12 text-status-paid",
  processing:
    "border-status-processing/30 bg-status-processing/12 text-status-processing",
  shipped: "border-status-shipped/30 bg-status-shipped/12 text-status-shipped",
  delivered:
    "border-status-delivered/30 bg-status-delivered/12 text-status-delivered",
  cancelled:
    "border-status-cancelled/30 bg-status-cancelled/12 text-status-cancelled",
  refunded:
    "border-status-refunded/30 bg-status-refunded/12 text-status-refunded",
  archived:
    "border-status-archived/25 bg-status-archived/10 text-status-archived",
};

export function StatusPill({
  tone,
  label,
  className,
}: {
  tone: StatusTone;
  label: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-6 shrink-0 items-center gap-1.5 rounded-full border px-2.5 text-xs font-medium whitespace-nowrap",
        toneClasses[tone],
        className,
      )}
    >
      <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}