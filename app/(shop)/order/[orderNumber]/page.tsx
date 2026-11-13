import type { Metadata } from "next";
import Link from "next/link";
import { io } from "next/cache";
import {
  CircleAlert,
  CircleCheck,
  MapPin,
  MessageCircle,
  NotebookPen,
  Truck,
} from "lucide-react";
import { Container } from "@/components/storefront/container";
import {
  OrderStatusTracker,
  orderStatusLabels,
} from "@/components/storefront/order-status-tracker";
import { PaymentProofForm } from "@/components/storefront/payment-proof-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";
import { prisma } from "@/lib/db";
import {
  getOrderAccessCookieValue,
  selectOrderAccessToken,
} from "@/lib/order-access";
import { manualEasypaisaProvider } from "@/lib/payments/manual";
import { siteConfig } from "@/lib/site-config";
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

const statusBadgeVariants = {
  PENDING: "gold",
  PAID: "success",
  PROCESSING: "outline",
  SHIPPED: "default",
  DELIVERED: "success",
  CANCELLED: "destructive",
  REFUNDED: "secondary",
} as const;

export default async function OrderConfirmationPage({
  params,
  searchParams,
}: OrderPageProps) {
  const [{ orderNumber }, query] = await Promise.all([params, searchParams]);
  const urlToken = typeof query.token === "string" ? query.token : null;
  const cookieValue = await getOrderAccessCookieValue(orderNumber);
  // cacheComponents: the database connect reads crypto.randomBytes, which is
  // illegal outside the dynamic stage. Advance before querying.
  await io();
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
        <section className="border-silver bg-card mx-auto max-w-2xl rounded-2xl border p-6 text-center shadow-soft sm:p-9">
          <span className="bg-gold/20 text-gold-text dark:text-gold-light mx-auto inline-flex size-14 items-center justify-center rounded-2xl">
            <CircleAlert aria-hidden="true" className="size-6" />
          </span>
          <h1 className="font-heading mt-5 text-2xl font-bold">
            Order not found
          </h1>
          <p className="text-muted-foreground mt-2">
            We could not verify this order confirmation.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button nativeButton={false} render={<Link href="/" />} variant="outline">
              Go home
            </Button>
            <Button nativeButton={false} render={<Link href="/products" />}>
              Continue shopping
            </Button>
          </div>
        </section>
      </Container>
    );
  }

  const whatsappHref = buildWhatsAppLink({
    number: siteConfig.whatsappNumber,
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
      <div className="mx-auto max-w-4xl">
        <div className="flex items-start gap-4">
          <span className="bg-success/15 text-success hidden size-12 shrink-0 items-center justify-center rounded-2xl sm:inline-flex">
            <CircleCheck aria-hidden="true" className="size-6" />
          </span>
          <div>
            <p className="text-brand text-sm font-semibold">Order received</p>
            <h1 className="font-heading mt-1 text-h1 font-bold text-balance">
              Thank you, {order.customerName}
            </h1>
            <p className="text-muted-foreground mt-2">
              Order <span className="font-semibold text-foreground">{order.orderNumber}</span> is pending payment confirmation.
            </p>
          </div>
        </div>

        <p className="text-muted-foreground mt-5 text-sm">
          Save your order number and track it any time.{' '}
          <Link className="text-foreground inline-flex min-h-11 items-center rounded-md underline underline-offset-4" href="/track-order">Track order</Link>
        </p>

        <div className="border-silver bg-card mt-8 rounded-2xl border px-4 py-6 shadow-soft sm:px-8">
          <OrderStatusTracker status={order.status} />
        </div>

        <div className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="min-w-0 space-y-8">
            <section
              aria-labelledby="next-steps-heading"
              className="border-silver bg-card rounded-2xl border p-5 shadow-soft sm:p-6"
            >
              <h2 className="font-heading text-xl font-semibold" id="next-steps-heading">
                What happens next
              </h2>
              <ol className="mt-4 space-y-4">
                {[
                  "Send the payment screenshot on WhatsApp with your order number.",
                  "Add your transaction ID below so your payment can be matched.",
                  "I will confirm payment and prepare your order.",
                ].map((step, index) => (
                  <li className="flex items-start gap-3" key={step}>
                    <span className="bg-gold/20 text-gold-text dark:text-gold-light inline-flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-bold">
                      {index + 1}
                    </span>
                    <span className="text-muted-foreground pt-0.5 text-sm leading-6">
                      {step}
                    </span>
                  </li>
                ))}
              </ol>
            </section>

            <section
              aria-labelledby="order-details-heading"
              className="border-silver bg-card rounded-2xl border p-5 shadow-soft sm:p-6"
            >
              <h2 className="font-heading text-xl font-semibold" id="order-details-heading">
                Order details
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
                  <dt className="text-muted-foreground">Subtotal</dt>
                  <dd className="font-semibold">{formatPrice(order.subtotal)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Delivery</dt>
                  <dd className="font-semibold">
                    {order.shipping ? formatPrice(order.shipping) : "Free"}
                  </dd>
                </div>
                <div className="border-silver flex justify-between gap-4 border-t pt-3 text-base font-bold">
                  <dt>Total</dt>
                  <dd>{formatPrice(order.total)}</dd>
                </div>
              </dl>

              <div className="border-silver mt-5 space-y-5 border-t pt-5">
                <div>
                  <h3 className="flex items-center gap-2 text-sm font-semibold">
                    <MapPin aria-hidden="true" className="text-gold-text dark:text-gold-light size-4" />
                    Delivery address
                  </h3>
                  <p className="text-muted-foreground mt-1.5 text-sm leading-6">
                    {address}
                  </p>
                </div>
                {order.giftNote && (
                  <div>
                    <h3 className="flex items-center gap-2 text-sm font-semibold">
                      <NotebookPen aria-hidden="true" className="text-gold-text dark:text-gold-light size-4" />
                      Gift note
                    </h3>
                    <p className="text-muted-foreground mt-1.5 text-sm leading-6 whitespace-pre-line">
                      {order.giftNote}
                    </p>
                  </div>
                )}
                {order.orderNotes && (
                  <div>
                    <h3 className="flex items-center gap-2 text-sm font-semibold">
                      <NotebookPen aria-hidden="true" className="text-gold-text dark:text-gold-light size-4" />
                      Order notes
                    </h3>
                    <p className="text-muted-foreground mt-1.5 text-sm leading-6 whitespace-pre-line">
                      {order.orderNotes}
                    </p>
                  </div>
                )}
                {(order.trackingNumber || order.courierName) && (
                  <div>
                    <h3 className="flex items-center gap-2 text-sm font-semibold">
                      <Truck aria-hidden="true" className="text-gold-text dark:text-gold-light size-4" />
                      Tracking
                    </h3>
                    <p className="text-muted-foreground mt-1.5 text-sm leading-6">
                      {[order.courierName, order.trackingNumber]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                )}
              </div>
            </section>
          </div>

          <aside className="border-silver bg-card h-fit rounded-2xl border p-5 shadow-soft lg:sticky lg:top-28">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-heading text-xl font-semibold">Payment</h2>
              <Badge variant={statusBadgeVariants[order.status]}>
                {orderStatusLabels[order.status]}
              </Badge>
            </div>
            <p className="mt-4 font-semibold">Easypaisa wallet transfer</p>
            <p className="text-muted-foreground mt-2 whitespace-pre-line text-sm leading-6">
              {manualEasypaisaProvider.getInstructions()}
            </p>
            {whatsappHref && (
              <a
                className="border-brand text-foreground lift-sm press hover-fine:hover:bg-brand/5 focus-visible:outline-ring mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg border px-4 py-2 text-center font-semibold focus-visible:outline-2 focus-visible:outline-offset-2"
                href={whatsappHref}
                rel="noopener noreferrer"
                target="_blank"
              >
                <MessageCircle aria-hidden="true" className="size-5 shrink-0 text-brand" />
                Send payment screenshot on WhatsApp
              </a>
            )}
            <div className="border-silver mt-5 border-t pt-5">
              <h3 className="font-semibold">Already sent the payment?</h3>
              <p className="text-muted-foreground mt-2 text-sm leading-6">
                Add the Easypaisa transaction ID so your transfer can be matched
                to this order.
              </p>
              <PaymentProofForm
                canEdit={order.status === "PENDING"}
                hasReported={order.paymentReportedAt !== null}
                initialNote={order.paymentNote}
                initialTransactionId={order.paymentReference}
                orderNumber={order.orderNumber}
                token={accessToken}
              />
            </div>
          </aside>
        </div>
      </div>
    </Container>
  );
}