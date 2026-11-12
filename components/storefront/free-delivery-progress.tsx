import { Check, Truck } from "lucide-react";
import { cn } from "cn";
import { formatPrice } from "@/lib/format";

/**
 * Free-delivery progress derived from the real threshold and the same
 * calculateShippingFee result shown at checkout. Renders nothing for an
 * empty cart so the unlocked state is never claimed without items.
 */
export function FreeDeliveryProgress({
  subtotal,
  deliveryFee,
  threshold,
  className,
}: {
  subtotal: number;
  deliveryFee: number;
  threshold: number;
  className?: string;
}) {
  if (subtotal <= 0 || threshold <= 0) return null;

  const unlocked = deliveryFee === 0;
  const remaining = Math.max(0, threshold - subtotal);
  const percent = Math.min(100, Math.round((subtotal / threshold) * 100));

  return (
    <div className={cn("bg-muted/60 rounded-xl p-3.5", className)}>
      <div className="flex items-center gap-2 text-sm">
        {unlocked ? (
          <Check aria-hidden="true" className="size-4 shrink-0 text-success" />
        ) : (
          <Truck
            aria-hidden="true"
            className="text-gold-text dark:text-gold-light size-4 shrink-0"
          />
        )}
        <p className="font-medium">
          {unlocked ? (
            "Your order qualifies for free delivery."
          ) : (
            <>
              Add <span className="font-semibold">{formatPrice(remaining)}</span>{" "}
              more for free delivery.
            </>
          )}
        </p>
      </div>
      <div
        aria-label="Progress toward free delivery"
        aria-valuemax={100}
        aria-valuemin={0}
        aria-valuenow={percent}
        className="bg-silver/60 mt-2.5 h-1.5 overflow-hidden rounded-full"
        role="progressbar"
      >
        <div
          className={cn(
            "h-full rounded-full",
            unlocked ? "bg-success" : "bg-gold-700 dark:bg-gold-light",
          )}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}