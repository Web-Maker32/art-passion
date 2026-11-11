import { Truck } from "lucide-react";
import { deliveryInfoLine, siteConfig } from "@/lib/site-config";

/**
 * Slim gold announcement ribbon above the sticky header. Derived entirely from
 * siteConfig so the delivery amounts are never written twice. Renders nothing
 * if the delivery values are not configured.
 */
export function AnnouncementBar() {
  const { deliveryFee, freeDeliveryThreshold } = siteConfig;
  if (
    !Number.isInteger(deliveryFee) ||
    deliveryFee <= 0 ||
    !Number.isInteger(freeDeliveryThreshold) ||
    freeDeliveryThreshold <= 0
  ) {
    return null;
  }

  return (
    <div className="bg-gold text-header-teal relative z-40 border-b border-brand-deep/15">
      <p className="mx-auto flex min-h-9 max-w-7xl items-center justify-center gap-2 px-4 py-1.5 text-center text-xs font-semibold tracking-wide sm:text-sm">
        <Truck aria-hidden="true" className="size-4 shrink-0" />
        <span>{deliveryInfoLine}</span>
      </p>
    </div>
  );
}