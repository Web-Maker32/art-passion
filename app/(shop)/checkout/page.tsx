import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { ChevronDown } from "lucide-react";
import { CheckoutSummary } from "@/components/storefront/checkout-summary";
import { Container } from "@/components/storefront/container";
import { CheckoutForm } from "@/components/storefront/checkout-form";
import { getCart } from "@/lib/cart";
import { buildCartWhatsAppMessage } from "@/lib/cart-whatsapp";
import { formatPrice } from "@/lib/format";
import { calculateShippingFee } from "@/lib/shipping";
import { siteConfig } from "@/lib/site-config";
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
    number: siteConfig.whatsappNumber,
    message: buildCartWhatsAppMessage(cart),
  });

  return (
    <Container className="py-8 sm:py-12">
      <div className="max-w-3xl">
        <h1 className="font-heading text-h1 font-bold text-balance">
          Checkout
        </h1>
        <p className="text-muted-foreground mt-2">
          Add your delivery details and place your Easypaisa order.
        </p>
      </div>

      <details className="group border-silver bg-card mt-6 rounded-2xl border shadow-soft lg:hidden">
        <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 rounded-2xl px-4 font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring [&::-webkit-details-marker]:hidden">
          <span>
            Order summary
            <span className="text-muted-foreground ml-2 text-sm font-normal">
              {cart.itemCount} {cart.itemCount === 1 ? "item" : "items"}
            </span>
          </span>
          <span className="flex items-center gap-2">
            <span className="font-heading text-brand text-lg font-bold">
              {formatPrice(total)}
            </span>
            <ChevronDown
              aria-hidden="true"
              className="text-muted-foreground size-4 motion-safe:transition-transform motion-safe:duration-interaction group-open:rotate-180"
            />
          </span>
        </summary>
        <div className="border-silver border-t px-4 pt-4 pb-5">
          <CheckoutSummary cart={cart} shipping={shipping} total={total} />
        </div>
      </details>

      <div className="mt-6 grid items-start gap-8 lg:mt-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0">
          <CheckoutForm
            idempotencyKey={idempotencyKey}
            whatsappHref={whatsappHref}
          />
        </div>

        <aside className="border-silver bg-card hidden rounded-2xl border p-5 shadow-soft lg:sticky lg:top-28 lg:block">
          <h2 className="font-heading mb-5 text-xl font-semibold">
            Order summary
          </h2>
          <CheckoutSummary cart={cart} shipping={shipping} total={total} />
        </aside>
      </div>
    </Container>
  );
}