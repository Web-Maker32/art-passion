import Image from "next/image";
import Link from "next/link";
import { FreeDeliveryProgress } from "@/components/storefront/free-delivery-progress";
import { Button } from "@/components/ui/button";
import type { CartView } from "@/lib/cart-types";
import { formatPrice } from "@/lib/format";
import { siteConfig } from "@/lib/site-config";

/**
 * Order summary shared by the desktop sticky aside and the mobile
 * collapsible panel. Totals come from the same calculateShippingFee result
 * used when the order is created.
 */
export function CheckoutSummary({
  cart,
  shipping,
  total,
}: {
  cart: CartView;
  shipping: number;
  total: number;
}) {
  return (
    <div className="space-y-5">
      <ul className="space-y-4">
        {cart.items.map((item) => (
          <li className="flex items-center gap-3" key={item.itemId}>
            <div className="bg-muted relative size-14 shrink-0 overflow-hidden rounded-lg">
              <Image
                alt={item.imageAlt}
                className="object-cover"
                fill
                sizes="56px"
                src={item.imageUrl || "/placeholder.svg"}
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-sm font-medium">
                {item.productTitle}
              </p>
              <p className="text-muted-foreground mt-0.5 text-xs">
                {item.variantLabel} · Qty {item.quantity}
              </p>
            </div>
            <p className="shrink-0 text-sm font-semibold">
              {formatPrice(item.lineTotal)}
            </p>
          </li>
        ))}
      </ul>
      <FreeDeliveryProgress
        deliveryFee={shipping}
        subtotal={cart.subtotal}
        threshold={siteConfig.freeDeliveryThreshold}
      />
      <dl className="space-y-3 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Subtotal</dt>
          <dd className="font-semibold">{formatPrice(cart.subtotal)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Delivery</dt>
          <dd className="font-semibold">
            {shipping ? formatPrice(shipping) : "Free"}
          </dd>
        </div>
        <div className="border-silver flex justify-between gap-4 border-t pt-3 text-base font-bold">
          <dt>Total</dt>
          <dd>{formatPrice(total)}</dd>
        </div>
      </dl>
      <Button
        className="w-full"
        nativeButton={false}
        render={<Link href="/cart" />}
        variant="outline"
      >
        Back to cart
      </Button>
    </div>
  );
}