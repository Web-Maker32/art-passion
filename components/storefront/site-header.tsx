import { Suspense } from "react";
import { getCart } from "@/lib/cart";
import { emptyCartView } from "@/lib/cart-types";
import { calculateShippingFee } from "@/lib/shipping";
import { siteConfig } from "@/lib/site-config";
import { SiteHeaderPresentation } from "@/components/storefront/site-header-presentation";

export function SiteHeader() {
  return (
    <Suspense
      fallback={
        <SiteHeaderPresentation
          cart={emptyCartView()}
          deliveryFee={0}
          freeDeliveryThreshold={siteConfig.freeDeliveryThreshold}
        />
      }
    >
      <HeaderWithCart />
    </Suspense>
  );
}

async function HeaderWithCart() {
  const cart = await getCart();
  return (
    <SiteHeaderPresentation
      cart={cart}
      deliveryFee={calculateShippingFee(cart.subtotal)}
      freeDeliveryThreshold={siteConfig.freeDeliveryThreshold}
    />
  );
}
