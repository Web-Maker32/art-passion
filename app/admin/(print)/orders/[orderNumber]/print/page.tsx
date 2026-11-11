import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PrintButton } from "@/components/admin/print-button";
import { requireAdmin } from "@/lib/admin-auth";
import { formatKarachiDate } from "@/lib/admin-datetime";
import { formatPrice } from "@/lib/format";
import { getAdminOrder } from "@/lib/queries/admin-orders";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Packing slip",
  robots: { index: false, follow: false },
};

// Admin-only page: requireAdmin() reads cookies, so render per request.
export const instant = false;

/**
 * Chrome-free packing slip. It lives in its own route group so the admin header
 * never renders here, and the layout is fixed to black on white so a dark-mode
 * admin still prints a clean page.
 */
export default async function AdminOrderPrintPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  await requireAdmin();
  const { orderNumber } = await params;
  const order = await getAdminOrder(orderNumber);

  if (!order) {
    notFound();
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

  return (
    <main className="min-h-screen bg-white text-black">
      <div className="mx-auto w-full max-w-3xl p-6 sm:p-10 print:max-w-none print:p-0">
        <div className="flex items-center justify-between gap-4 print:hidden">
          <Link
            className="text-sm underline underline-offset-4"
            href={`/admin/orders/${order.orderNumber}`}
          >
            ← Back to order
          </Link>
          <PrintButton />
        </div>

        <header className="mt-6 border-b-2 border-black pb-4 print:mt-0">
          <p className="text-xs font-semibold tracking-[0.2em] uppercase">
            {siteConfig.storeName}
          </p>
          <h1 className="font-heading mt-1 text-3xl font-bold">Packing slip</h1>
          <p className="mt-1 text-sm">
            Order <span className="font-semibold">{order.orderNumber}</span> ·{" "}
            {formatKarachiDate(order.createdAt)}
          </p>
        </header>

        <section className="mt-6 grid gap-6 sm:grid-cols-2">
          <div>
            <h2 className="text-xs font-semibold tracking-[0.15em] uppercase">
              Ship to
            </h2>
            <p className="mt-2 font-semibold">{order.customerName}</p>
            <p className="text-sm">{order.customerPhone}</p>
            <p className="mt-1 text-sm leading-6">{address}</p>
          </div>
          <div>
            <h2 className="text-xs font-semibold tracking-[0.15em] uppercase">
              Shipping
            </h2>
            <dl className="mt-2 space-y-1 text-sm">
              <div className="flex justify-between gap-3">
                <dt>Courier</dt>
                <dd className="text-right">{order.courierName ?? "—"}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt>Tracking</dt>
                <dd className="text-right">{order.trackingNumber ?? "—"}</dd>
              </div>
            </dl>
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-xs font-semibold tracking-[0.15em] uppercase">
            Items
          </h2>
          <table className="mt-3 w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-black text-left">
                <th className="py-2 pr-3 font-semibold">Item</th>
                <th className="py-2 pr-3 font-semibold">Variant</th>
                <th className="py-2 text-right font-semibold">Qty</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr className="border-b border-neutral-300 align-top" key={item.id}>
                  <td className="py-2 pr-3">
                    {item.productTitle}
                    {item.madeToOrder && item.leadTimeDays !== null && (
                      <span className="block text-xs">
                        Made to order · {item.leadTimeDays} days
                      </span>
                    )}
                  </td>
                  <td className="py-2 pr-3">{item.variantLabel}</td>
                  <td className="py-2 text-right font-semibold">{item.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {(order.giftNote || order.orderNotes) && (
          <section className="mt-8">
            <h2 className="text-xs font-semibold tracking-[0.15em] uppercase">
              Notes
            </h2>
            {order.giftNote && (
              <p className="mt-2 text-sm leading-6">
                <span className="font-semibold">Gift note:</span> {order.giftNote}
              </p>
            )}
            {order.orderNotes && (
              <p className="mt-1 text-sm leading-6">
                <span className="font-semibold">Order notes:</span>{" "}
                {order.orderNotes}
              </p>
            )}
          </section>
        )}

        <section className="mt-8 ml-auto w-full max-w-xs">
          <dl className="space-y-1 text-sm">
            <div className="flex justify-between gap-4">
              <dt>Subtotal</dt>
              <dd>{formatPrice(order.subtotal)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>Delivery</dt>
              <dd>{order.shipping ? formatPrice(order.shipping) : "Free"}</dd>
            </div>
            <div className="flex justify-between gap-4 border-t border-black pt-2 text-base font-bold">
              <dt>Total</dt>
              <dd>{formatPrice(order.total)}</dd>
            </div>
          </dl>
        </section>
      </div>
    </main>
  );
}
