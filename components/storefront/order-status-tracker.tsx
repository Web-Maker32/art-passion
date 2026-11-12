import {
  BadgeCheck,
  Clock,
  Package,
  PackageCheck,
  Truck,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { cn } from "cn";
import type { OrderStatus } from "@/generated/prisma/client";

const steps: Array<{ status: OrderStatus; label: string; icon: LucideIcon }> = [
  { status: "PENDING", label: "Pending", icon: Clock },
  { status: "PAID", label: "Paid", icon: BadgeCheck },
  { status: "PROCESSING", label: "Processing", icon: Package },
  { status: "SHIPPED", label: "Shipped", icon: Truck },
  { status: "DELIVERED", label: "Delivered", icon: PackageCheck },
];

export const orderStatusLabels: Record<OrderStatus, string> = {
  PENDING: "Pending payment",
  PAID: "Paid",
  PROCESSING: "Processing",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
};

/**
 * Forward-only progress tracker. Cancelled and refunded orders are terminal
 * exceptions and are shown as a separate notice instead of a step.
 */
export function OrderStatusTracker({ status }: { status: OrderStatus }) {
  if (status === "CANCELLED" || status === "REFUNDED") {
    return (
      <div
        className="border-destructive/30 bg-destructive/10 text-destructive flex items-center gap-2.5 rounded-2xl border px-5 py-4 font-semibold"
        role="status"
      >
        <XCircle aria-hidden="true" className="size-5 shrink-0" />
        {status === "CANCELLED"
          ? "This order was cancelled."
          : "This order was refunded."}
      </div>
    );
  }

  const currentIndex = steps.findIndex((step) => step.status === status);

  return (
    <ol aria-label="Order progress" className="flex">
      {steps.map((step, index) => {
        const done = index <= currentIndex;
        const isCurrent = index === currentIndex;
        const Icon = step.icon;
        return (
          <li
            aria-current={isCurrent ? "step" : undefined}
            className="relative flex flex-1 flex-col items-center gap-1.5"
            key={step.status}
          >
            {index > 0 && (
              <span
                aria-hidden="true"
                className={cn(
                  "absolute top-4 right-1/2 left-[-50%] h-0.5",
                  index <= currentIndex
                    ? "bg-brand dark:bg-gold-light"
                    : "bg-silver-strong",
                )}
              />
            )}
            <span
              className={cn(
                "relative z-10 inline-flex size-8 items-center justify-center rounded-full border-2",
                done
                  ? "border-brand bg-brand text-brand-foreground dark:border-gold-light dark:bg-gold-light dark:text-header-teal"
                  : "border-silver-strong bg-card text-muted-foreground",
                isCurrent &&
                  "ring-2 ring-gold ring-offset-2 ring-offset-background",
              )}
            >
              <Icon aria-hidden="true" className="size-4" />
            </span>
            <span
              className={cn(
                "text-center text-xs font-semibold",
                done ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {step.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}