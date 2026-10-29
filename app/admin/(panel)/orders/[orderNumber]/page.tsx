import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { getAdminOrder } from "@/lib/queries/admin-orders";
import { formatKarachiDateTime } from "@/lib/admin-datetime";
import { formatPrice } from "@/lib/format";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { buttonVariants } from "@/components/ui/button";
import { OrderStatusBadge } from "@/components/admin/order-status-badge";
import { OrderStatusPanel } from "@/components/admin/order-status-panel";

export const metadata: Metadata = {
  title: "Order detail",
  robots: { index: false, follow: false },
};

// Dynamic route + cacheComponents: the root layout's client header uses
// usePathname(), which blocks prerendering. Render this page at request time.
export const instant = false;

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-1.5">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  await requireAdmin();
  const { orderNumber } = await params;
  const order = await getAdminOrder(orderNumber);

  if (!order) {
    return (
      <div className="space-y-4">
        <h1 className="font-heading text-2xl font-bold">Order not found</h1>
        <p className="text-muted-foreground text-sm">
          No order matches <span className="text-foreground">{orderNumber}</span>.
        </p>
        <Link className={buttonVariants({ variant: "outline" })} href="/admin/orders">
          Back to orders
        </Link>
      </div>
    );
  }

  const address = [
    order.addressLine1,
    order.addressLine2,
    [order.city, order.province, order.postalCode, order.country]
      .filter(Boolean)
      .join(", "),
  ]
    .filter(Boolean)
    .join(", ");

  const whatsappHref = buildWhatsAppLink({
    number: order.customerPhone,
    message: [
      `Hello ${order.customerName}, this is Art Passion about your order ${order.orderNumber}.`,
      `Status: ${order.status}.`,
      `Total: ${formatPrice(order.total)}.`,
    ].join("\n"),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            className="text-muted-foreground text-sm underline-offset-4 hover-fine:hover:underline"
            href="/admin/orders"
          >
            ← Orders
          </Link>
          <h1 className="font-heading mt-1 text-2xl font-bold sm:text-3xl">
            {order.orderNumber}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Placed {formatKarachiDateTime(order.createdAt)} (Asia/Karachi)
          </p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-6">
          <section aria-labelledby="items-heading" className="border-silver bg-card rounded-xl border p-5">
            <h2 className="font-heading text-lg font-semibold" id="items-heading">
              Items
            </h2>
            <ul className="border-silver mt-3 divide-y border-y">
              {order.items.map((item) => (
                <li className="flex justify-between gap-4 py-3" key={item.id}>
                  <span className="min-w-0">
                    <span className="block font-medium">{item.productTitle}</span>
                    <span className="text-muted-foreground text-sm">
                      {item.variantLabel} · Qty {item.quantity}
                    </span>
                    {item.madeToOrder && item.leadTimeDays !== null && (
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
            <dl className="mt-3 space-y-1 text-sm">
              <DetailRow label="Subtotal" value={formatPrice(order.subtotal)} />
              <DetailRow
                label="Delivery"
                value={order.shipping ? formatPrice(order.shipping) : "Free"}
              />
              <div className="border-silver mt-2 flex justify-between gap-4 border-t pt-3 text-base font-bold">
                <dt>Total</dt>
                <dd>{formatPrice(order.total)}</dd>
              </div>
            </dl>
          </section>

          <section aria-labelledby="history-heading" className="border-silver bg-card rounded-xl border p-5">
            <h2 className="font-heading text-lg font-semibold" id="history-heading">
              History
            </h2>
            {order.events.length === 0 ? (
              <p className="text-muted-foreground mt-2 text-sm">
                No changes recorded yet.
              </p>
            ) : (
              <ol className="mt-3 space-y-3">
                {order.events.map((event) => (
                  <li className="border-silver border-l-2 pl-4" key={event.id}>
                    <p className="text-sm font-medium">
                      {event.fromStatus && event.toStatus
                        ? `${event.fromStatus} → ${event.toStatus}`
                        : event.type}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {formatKarachiDateTime(event.createdAt)}
                    </p>
                    {event.note && (
                      <p className="text-muted-foreground mt-1 text-sm">
                        {event.note}
                      </p>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>

        <aside className="space-y-6">
          <section className="border-silver bg-card rounded-xl border p-5">
            <h2 className="font-heading text-lg font-semibold">Status</h2>
            <div className="mt-3">
              <OrderStatusPanel
                orderNumber={order.orderNumber}
                status={order.status}
              />
            </div>
          </section>

          <section className="border-silver bg-card rounded-xl border p-5">
            <h2 className="font-heading text-lg font-semibold">Customer</h2>
            <dl className="mt-2 divide-y text-sm">
              <DetailRow label="Name" value={order.customerName} />
              <DetailRow label="Phone" value={order.customerPhone} />
              <DetailRow label="Email" value={order.customerEmail ?? "—"} />
            </dl>
            <div className="mt-3">
              <p className="text-muted-foreground text-sm">Delivery address</p>
              <p className="mt-1 text-sm leading-6">{address}</p>
            </div>
            {whatsappHref && (
              <a
                className="bg-primary text-primary-foreground lift-sm press hover-fine:hover:bg-primary-hover focus-visible:outline-ring mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-md px-4 py-2 text-center font-semibold focus-visible:outline-2 focus-visible:outline-offset-2"
                href={whatsappHref}
                rel="noreferrer"
                target="_blank"
              >
                Message customer on WhatsApp
              </a>
            )}
          </section>

          <section className="border-silver bg-card rounded-xl border p-5">
            <h2 className="font-heading text-lg font-semibold">Payment</h2>
            <dl className="mt-2 divide-y text-sm">
              <DetailRow
                label="Method"
                value={
                  order.paymentMethod === "WALLET_TRANSFER"
                    ? "Easypaisa wallet transfer"
                    : order.paymentMethod
                }
              />
              <DetailRow label="Reference" value={order.paymentReference ?? "—"} />
            </dl>
          </section>

          <section className="border-silver bg-card rounded-xl border p-5">
            <h2 className="font-heading text-lg font-semibold">Shipping</h2>
            <dl className="mt-2 divide-y text-sm">
              <DetailRow label="Courier" value={order.courierName ?? "—"} />
              <DetailRow label="Tracking" value={order.trackingNumber ?? "—"} />
            </dl>
          </section>

          {(order.giftNote || order.orderNotes) && (
            <section className="border-silver bg-card rounded-xl border p-5">
              <h2 className="font-heading text-lg font-semibold">Notes</h2>
              {order.giftNote && (
                <div className="mt-2">
                  <p className="text-muted-foreground text-sm">Gift note</p>
                  <p className="mt-1 text-sm leading-6">{order.giftNote}</p>
                </div>
              )}
              {order.orderNotes && (
                <div className="mt-3">
                  <p className="text-muted-foreground text-sm">Order notes</p>
                  <p className="mt-1 text-sm leading-6">{order.orderNotes}</p>
                </div>
              )}
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
