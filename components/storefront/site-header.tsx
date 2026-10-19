import { Suspense } from "react";
import { getCart } from "@/lib/cart";
import { emptyCartView } from "@/lib/cart-types";
import { SiteHeaderPresentation } from "@/components/storefront/site-header-presentation";

export function SiteHeader() {
  return (
    <Suspense
      fallback={<SiteHeaderPresentation cart={emptyCartView()} />}
    >
      <HeaderWithCart />
    </Suspense>
  );
}

async function HeaderWithCart() {
  const cart = await getCart();
  return <SiteHeaderPresentation cart={cart} />;
}
