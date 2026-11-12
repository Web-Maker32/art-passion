import Image from "next/image";
import Link from "next/link";
import { MessageCircle, ShoppingBag } from "lucide-react";
import { CartItemControls, ClearCartButton } from "@/components/storefront/cart-controls";
import { Container } from "@/components/storefront/container";
import { FreeDeliveryProgress } from "@/components/storefront/free-delivery-progress";
import { Button } from "@/components/ui/button";
import { getCart } from "@/lib/cart";
import { formatPrice } from "@/lib/format";
import { calculateShippingFee } from "@/lib/shipping";
import { siteConfig } from "@/lib/site-config";
import { buildCartWhatsAppMessage } from "@/lib/cart-whatsapp";
import { buildWhatsAppLink } from "@/lib/whatsapp";

export const metadata = {
  title: "Your cart",
  description: "Review your Art Passion handmade finds.",
  robots: { index: false, follow: false },
};

export default async function CartPage() {
  const cart = await getCart();
  const shipping = calculateShippingFee(cart.subtotal);
  const total = cart.subtotal + shipping;
  const whatsappHref = buildWhatsAppLink({
    number: process.env.WHATSAPP_NUMBER,
    message: buildCartWhatsAppMessage(cart),
  });

  return (
    <Container className="py-8 sm:py-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-h1 font-bold text-balance">
            Your cart
          </h1>
          <p className="text-muted-foreground mt-2">
            {cart.itemCount} {cart.itemCount === 1 ? "item" : "items"}
          </p>
        </div>
        {cart.items.length > 0 && <ClearCartButton />}
      </div>

      {cart.items.length === 0 ? (
        <section className="border-silver bg-card mt-8 rounded-2xl border p-8 text-center shadow-soft sm:p-12">
          <span className="bg-gold/20 text-gold-text dark:text-gold-light mx-auto inline-flex size-14 items-center justify-center rounded-2xl">
            <ShoppingBag aria-hidden="true" className="size-6" />
          </span>
          <h2 className="font-heading mt-5 text-2xl font-semibold text-balance">
            Your cart is waiting for something lovely
          </h2>
          <p className="text-muted-foreground mx-auto mt-2 max-w-md">
            Browse our handmade collection and find a piece to make or gift.
          </p>
          <Button
            className="mt-6"
            nativeButton={false}
            render={<Link href="/products" />}
            size="lg"
          >
            Continue shopping
          </Button>
        </section>
      ) : (
        <div className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <ul className="space-y-4">
            {cart.items.map((item) => (
              <li
                className="border-silver bg-card grid gap-4 rounded-2xl border p-4 shadow-soft transition-colors duration-interaction hover-fine:hover:bg-muted/60 sm:grid-cols-[7rem_minmax(0,1fr)] sm:p-5"
                key={item.itemId}
              >
                <Link
                  aria-label={`View ${item.productTitle}`}
                  className="bg-muted focus-visible:outline-ring relative aspect-square overflow-hidden rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2"
                  href={`/products/${item.productSlug}`}
                >
                  <Image
                    alt={item.imageAlt}
                    className="object-cover"
                    fill
                    sizes="(max-width: 640px) 100vw, 112px"
                    src={item.imageUrl || "/placeholder.svg"}
                  />
                </Link>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="font-heading text-lg font-semibold">
                        <Link
                          className="focus-visible:outline-ring rounded-sm hover:text-brand hover:underline focus-visible:outline-2 focus-visible:outline-offset-2"
                          href={`/products/${item.productSlug}`}
                        >
                          {item.productTitle}
                        </Link>
                      </h2>
                      <p className="text-muted-foreground mt-1 text-sm">
                        {item.variantLabel}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-muted-foreground text-sm">
                        {formatPrice(item.unitPrice)} each
                      </p>
                      <p className="font-heading text-brand text-lg font-bold">
                        {formatPrice(item.lineTotal)}
                      </p>
                    </div>
                  </div>
                  {item.message && (
                    <p
                      className={`mt-3 rounded-lg px-3 py-2 text-sm font-medium ${
                        item.available
                          ? "bg-gold/15 text-gold-text dark:text-gold-light"
                          : "bg-destructive/10 text-destructive"
                      }`}
                      role="status"
                    >
                      {item.message}
                    </p>
                  )}
                  <div className="mt-4">
                    <CartItemControls
                      available={item.available}
                      editable={item.editable}
                      itemId={item.itemId}
                      maxQuantity={Math.min(item.stock, 20)}
                      productTitle={item.productTitle}
                      quantity={item.quantity}
                      variantLabel={item.variantLabel}
                    />
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <aside className="border-silver bg-card rounded-2xl border p-5 shadow-soft lg:sticky lg:top-28">
            <h2 className="font-heading text-xl font-semibold">
              Order summary
            </h2>
            <FreeDeliveryProgress
              className="mt-4"
              deliveryFee={shipping}
              subtotal={cart.subtotal}
              threshold={siteConfig.freeDeliveryThreshold}
            />
            <dl className="mt-5 space-y-3 text-sm">
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
            {cart.unavailableCount > 0 && (
              <p className="text-destructive mt-4 text-sm" role="alert">
                Remove or update unavailable items before checkout.
              </p>
            )}
            {cart.items.some((item) => item.message) && cart.unavailableCount === 0 && (
              <p className="text-destructive mt-4 text-sm" role="alert">
                Review updated prices before checkout.
              </p>
            )}
            {cart.unavailableCount > 0 || cart.items.some((item) => item.message) ? (
              <Button className="mt-5 w-full" disabled size="lg" type="button">
                Review your cart
              </Button>
            ) : (
              <Button
                className="mt-5 w-full"
                nativeButton={false}
                render={<Link href="/checkout" />}
                size="lg"
              >
                Checkout
              </Button>
            )}
            {whatsappHref ? (
              <a
                className="border-brand text-foreground lift-sm press hover-fine:hover:bg-brand/5 focus-visible:outline-ring mt-3 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg border px-4 py-2 text-center font-semibold focus-visible:outline-2 focus-visible:outline-offset-2"
                href={whatsappHref}
                rel="noopener noreferrer"
                target="_blank"
              >
                <MessageCircle
                  aria-hidden="true"
                  className="size-5 shrink-0 text-brand"
                />
                Order cart on WhatsApp
              </a>
            ) : (
              <p className="text-muted-foreground mt-3 text-center text-sm">
                WhatsApp ordering is currently unavailable.
              </p>
            )}
            <Link
              className="text-muted-foreground hover:text-brand mt-2 inline-flex min-h-11 w-full items-center justify-center rounded-lg text-sm font-semibold underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              href="/products"
            >
              Continue shopping
            </Link>
          </aside>
        </div>
      )}
    </Container>
  );
}