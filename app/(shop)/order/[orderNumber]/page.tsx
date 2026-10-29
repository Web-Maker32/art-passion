import type { Metadata } from "next";
import { Container } from "@/components/storefront/container";
import { env } from "@/lib/env";
import { formatPrice } from "@/lib/format";
import { prisma } from "@/lib/db";
import {
  getOrderAccessCookieValue,
  selectOrderAccessToken,
} from "@/lib/order-access";
import { manualEasypaisaProvider } from "@/lib/payments/manual";
import { buildOrderPaymentWhatsAppMessage, buildWhatsAppLink } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Order confirmation",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export const instant = false;

type OrderPageProps = {
  params: Promise<{ orderNumber: string }>;
  searchParams: Promise<{ token?: string | string[] }>;
};

export default async function OrderConfirmationPage({
  params,
  searchParams,
}: OrderPageProps) {
  const [{ orderNumber }, query] = await Promise.all([params, searchParams]);
  const urlToken = typeof query.token === "string" ? query.token : null;
  const cookieValue = await getOrderAccessCookieValue(orderNumber);
  const order =
    urlToken || cookieValue
      ? await prisma.order.findUnique({
          where: { orderNumber },
          include: { items: true },
        })
      : null;
  const accessToken =
    order && (urlToken || cookieValue)
      ? selectOrderAccessToken({
          orderNumber,
          storedHash: order.accessTokenHash,
          urlToken,
          cookieValue,
        })
      : null;

  if (!order || !accessToken) {
    return (
      <Container className="py-12 sm:py-16">
        <section className="border-silver bg-card mx-auto max-w-2xl rounded-xl border p-6 sm:p-9">
          <h1 className="font-heading text-2xl font-bold">Order not found</h1>
          <p className="text-muted-foreground mt-2">
            We could not verify this order confirmation.
          </p>
        </section>
      </Container>
    );
  }

  const whatsappHref = buildWhatsAppLink({
    number: env.WHATSAPP_NUMBER,
    message: buildOrderPaymentWhatsAppMessage({
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      total: formatPrice(order.total),
    }),
  });
  const address = [
    order.addressLine1,
    order.addressLine2,
    [order.city, order.province, order.postalCode, order.country]
      .filter(Boolean)
      .join(", "),
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <Container className="py-8 sm:py-12">
      <div className="mx-auto max-w-3xl">
        <p className="text-brand text-sm font-semibold">Order received</p>
        <h1 className="font-heading mt-2 text-3xl font-bold sm:text-4xl">
          Thank you, {order.customerName}
        </h1>
        <p className="text-muted-foreground mt-2">
          Order <span className="font-semibold text-foreground">{order.orderNumber}</span> is pending payment confirmation.
        </p>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="space-y-8">
            <section aria-labelledby="items-heading">
              <h2 className="font-heading text-xl font-semibold" id="items-heading">
                Items
              </h2>
              <ul className="border-silver mt-4 divide-y border-y">
                {order.items.map((item) => (
                  <li className="flex justify-between gap-4 py-4" key={item.id}>
                    <span className="min-w-0">
                      <span className="block font-medium">{item.productTitle}</span>
                      <span className="text-muted-foreground text-sm">
                        {item.variantLabel} · Qty {item.quantity}
                      </span>
                      {item.leadTimeDays !== null && (
                        <span className="text-muted-foreground block text-sm">
                          Made to order · {item.leadTimeDays} days
                        </span>
                      )}
                    </span>
                    <span className="shrink-0 font-semibold">
                      {formatPrice(item.unitPrice * item.quantity)}
                    </span>
                  </li>
                ))}
              </ul>
              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between gap-4">
                  <dt>Subtotal</dt>
                  <dd>{formatPrice(order.subtotal)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt>Delivery</dt>
                  <dd>{order.shipping ? formatPrice(order.shipping) : "Free"}</dd>
                </div>
                <div className="border-silver flex justify-between gap-4 border-t pt-3 text-base font-bold">
                  <dt>Total</dt>
                  <dd>{formatPrice(order.total)}</dd>
                </div>
              </dl>
            </section>

            <section aria-labelledby="address-heading">
              <h2 className="font-heading text-xl font-semibold" id="address-heading">
                Delivery address
              </h2>
              <p className="text-muted-foreground mt-2 leading-6">{address}</p>
            </section>
          </div>

          <aside className="border-silver bg-card h-fit rounded-xl border p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-heading text-xl font-semibold">Payment</h2>
              <span className="rounded-sm bg-gold/20 px-2 py-1 text-xs font-semibold text-gold-text">
                {order.status}
              </span>
            </div>
            <p className="mt-4 font-semibold">Easypaisa wallet transfer</p>
            <p className="text-muted-foreground mt-2 whitespace-pre-line text-sm leading-6">
              {manualEasypaisaProvider.getInstructions()}
            </p>
            <div className="border-silver mt-5 border-t pt-5">
              <h3 className="font-semibold">What happens next</h3>
              <ol className="text-muted-foreground mt-2 list-decimal space-y-2 pl-5 text-sm leading-6">
                <li>Send the payment screenshot on WhatsApp with your order number.</li>
                <li>I will confirm payment and prepare your order.</li>
              </ol>
              {whatsappHref && (
                <a
                  className="bg-primary text-primary-foreground lift-sm press hover-fine:hover:bg-primary-hover focus-visible:outline-ring mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-md px-4 py-2 text-center font-semibold focus-visible:outline-2 focus-visible:outline-offset-2"
                  href={whatsappHref}
                  rel="noreferrer"
                  target="_blank"
                >
                  Send payment screenshot on WhatsApp
                </a>
              )}
            </div>
          </aside>
        </div>
      </div>
    </Container>
  );
}