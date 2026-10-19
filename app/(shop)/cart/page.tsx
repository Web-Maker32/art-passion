import Image from "next/image";
import Link from "next/link";
import { CartItemControls, ClearCartButton } from "@/components/storefront/cart-controls";
import { Container } from "@/components/storefront/container";
import { Button } from "@/components/ui/button";
import { getCart } from "@/lib/cart";
import { formatPrice } from "@/lib/format";
import { buildCartWhatsAppMessage } from "@/lib/cart-whatsapp";
import { buildWhatsAppLink } from "@/lib/whatsapp";

export const metadata = {
  title: "Your cart",
  description: "Review your Art Passion handmade finds.",
};

export default async function CartPage() {
  const cart = await getCart();
  const whatsappHref = buildWhatsAppLink({
    number: process.env.WHATSAPP_NUMBER,
    message: buildCartWhatsAppMessage(cart),
  });

  return (
    <Container className="py-8 sm:py-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
            Your cart
          </h1>
          <p className="text-muted-foreground mt-2">
            {cart.itemCount} {cart.itemCount === 1 ? "item" : "items"}
          </p>
        </div>
        {cart.items.length > 0 && <ClearCartButton />}
      </div>

      {cart.items.length === 0 ? (
        <section className="border-silver bg-card mt-8 rounded-2xl border p-8 text-center sm:p-12">
          <h2 className="font-heading text-2xl font-semibold">
            Your cart is waiting for something lovely
          </h2>
          <p className="text-muted-foreground mt-2">
            Browse our handmade collection and find a piece to make or gift.
          </p>
          <Button
            className="mt-6 min-h-11"
            render={<Link href="/products" />}
          >
            Continue shopping
          </Button>
        </section>
      ) : (
        <div className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <ul className="space-y-4">
            {cart.items.map((item) => (
              <li
                className="border-silver bg-card grid gap-4 rounded-xl border p-4 sm:grid-cols-[7rem_minmax(0,1fr)] sm:p-5"
                key={item.itemId}
              >
                <Link
                  aria-label={`View ${item.productTitle}`}
                  className="bg-muted focus-visible:outline-ring relative aspect-square overflow-hidden rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2"
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
                    <div>
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
                      <p className="font-semibold">
                        {formatPrice(item.lineTotal)}
                      </p>
                    </div>
                  </div>
                  {item.message && (
                    <p
                      className={`mt-3 rounded-md px-3 py-2 text-sm font-medium ${
                        item.available
                          ? "bg-gold/15 text-gold-text"
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

          <aside className="border-silver bg-card rounded-xl border p-5 lg:sticky lg:top-28">
            <h2 className="font-heading text-xl font-semibold">
              Order summary
            </h2>
            <div className="mt-5 flex justify-between gap-4">
              <span>Subtotal</span>
              <span className="font-semibold">{formatPrice(cart.subtotal)}</span>
            </div>
            <p className="text-muted-foreground mt-2 text-sm">
              Shipping is calculated at checkout.
            </p>
            <div className="border-silver mt-4 flex justify-between gap-4 border-t pt-4 text-lg font-bold">
              <span>Total of items</span>
              <span>{formatPrice(cart.subtotal)}</span>
            </div>
            {cart.unavailableCount > 0 && (
              <p className="text-destructive mt-4 text-sm" role="alert">
                Remove or update unavailable items before checkout.
              </p>
            )}
            <Button className="mt-5 min-h-11 w-full" disabled type="button">
              Checkout
            </Button>
            <p className="text-muted-foreground mt-2 text-center text-xs">
              Checkout is coming soon.
            </p>
            {whatsappHref ? (
              <a
                className="border-brand text-brand hover:bg-brand/5 focus-visible:outline-ring mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-md border px-4 py-2 text-center font-semibold focus-visible:outline-2 focus-visible:outline-offset-2"
                href={whatsappHref}
                rel="noreferrer"
                target="_blank"
              >
                Order cart on WhatsApp
              </a>
            ) : (
              <p className="text-muted-foreground mt-3 text-center text-sm">
                WhatsApp ordering is currently unavailable.
              </p>
            )}
          </aside>
        </div>
      )}
    </Container>
  );
}
