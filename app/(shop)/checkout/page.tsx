import { randomUUID } from "node:crypto";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Container } from "@/components/storefront/container";
import { CheckoutForm } from "@/components/storefront/checkout-form";
import { Button } from "@/components/ui/button";
import { getCart } from "@/lib/cart";
import { buildCartWhatsAppMessage } from "@/lib/cart-whatsapp";
import { env } from "@/lib/env";
import { formatPrice } from "@/lib/format";
import { calculateShippingFee } from "@/lib/shipping";
import { buildWhatsAppLink } from "@/lib/whatsapp";

export const metadata = {
  title: "Checkout",
  description: "Place your Art Passion order.",
  robots: { index: false, follow: false },
};

export const instant = false;

export default async function CheckoutPage() {
  const cart = await getCart();
  if (
    cart.items.length === 0 ||
    cart.items.some((item) => !item.available || item.message)
  ) {
    redirect("/cart");
  }

  const shipping = calculateShippingFee(cart.subtotal);
  const total = cart.subtotal + shipping;
  await connection();
  const idempotencyKey = randomUUID();
  const whatsappHref = buildWhatsAppLink({
    number: env.WHATSAPP_NUMBER,
    message: buildCartWhatsAppMessage(cart),
  });

  return (
    <Container className="py-8 sm:py-12">
      <div className="max-w-3xl">
        <h1 className="font-heading text-3xl font-bold sm:text-4xl">Checkout</h1>
        <p className="text-muted-foreground mt-2">
          Add your delivery details and place your Easypaisa order.
        </p>
      </div>

      <div className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0">
          <CheckoutForm
            idempotencyKey={idempotencyKey}
            whatsappHref={whatsappHref}
          />
        </div>

        <aside className="border-silver bg-card rounded-xl border p-5 lg:sticky lg:top-28">
          <h2 className="font-heading text-xl font-semibold">Order summary</h2>
          <ul className="border-silver mt-4 space-y-4 border-b pb-4">
            {cart.items.map((item) => (
              <li className="flex justify-between gap-3 text-sm" key={item.itemId}>
                <span className="min-w-0">
                  <span className="block font-medium">{item.productTitle}</span>
                  <span className="text-muted-foreground block">
                    {item.variantLabel} · Qty {item.quantity}
                  </span>
                </span>
                <span className="shrink-0 font-semibold">
                  {formatPrice(item.lineTotal)}
                </span>
              </li>
            ))}
          </ul>
          <dl className="space-y-3 pt-4 text-sm">
            <div className="flex justify-between gap-4">
              <dt>Subtotal</dt>
              <dd className="font-semibold">{formatPrice(cart.subtotal)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>Delivery</dt>
              <dd className="font-semibold">{shipping ? formatPrice(shipping) : "Free"}</dd>
            </div>
            <div className="border-silver flex justify-between gap-4 border-t pt-3 text-base font-bold">
              <dt>Total</dt>
              <dd>{formatPrice(total)}</dd>
            </div>
          </dl>
          {shipping > 0 && (
            <p className="text-muted-foreground mt-4 text-sm">
              Add {formatPrice(env.FREE_SHIPPING_THRESHOLD - cart.subtotal)} more for free delivery.
            </p>
          )}
          <Button
            className="mt-5 min-h-11 w-full"
            nativeButton={false}
            render={<Link href="/cart" />}
            variant="outline"
          >
            Back to cart
          </Button>
        </aside>
      </div>
    </Container>
  );
}