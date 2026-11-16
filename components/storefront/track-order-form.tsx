"use client";

import { useState, type FormEvent } from "react";
import { MessageCircle, PackageSearch } from "lucide-react";
import {
  OrderStatusTracker,
  orderStatusLabels,
} from "@/components/storefront/order-status-tracker";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CopyButton } from "@/components/ui/copy-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatPrice } from "@/lib/format";
import { formatKarachiDateTime } from "@/lib/admin-datetime";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import {
  TRACK_ORDER_NOT_FOUND,
  trackOrderStatusMessages,
  type TrackOrderResponse,
  type TrackedOrder,
} from "@/lib/track-order-schema";

// Short, general statements only — no delivery-time promises. Colours reuse the
// site-wide --status-* tokens (the same tones as the admin status pills). The
// dot uses bg-current + the tone text colour, exactly like StatusPill.
const statusMeanings = [
  { label: "Pending", tone: "text-status-pending", text: "Awaiting payment confirmation." },
  { label: "Paid", tone: "text-status-paid", text: "Payment received." },
  { label: "Processing", tone: "text-status-processing", text: "Your order is being prepared." },
  { label: "Shipped", tone: "text-status-shipped", text: "On its way to you." },
  { label: "Delivered", tone: "text-status-delivered", text: "Delivered to your address." },
  { label: "Cancelled", tone: "text-status-cancelled", text: "This order was cancelled." },
] as const;

export function TrackOrderForm({ whatsappNumber }: { whatsappNumber: string }) {
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const whatsapp = buildWhatsAppLink({
    number: whatsappNumber,
    message: order
      ? `Hello Art Passion! I need help with order ${order.orderNumber}.`
      : "Hello Art Passion! I need help finding my order.",
  });

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const form = new FormData(event.currentTarget);
    setPending(true);
    setOrder(null);
    setMessage("");
    try {
      const response = await fetch("/api/track-order", {
        method: "POST",
        cache: "no-store",
        credentials: "omit",
        referrerPolicy: "no-referrer",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderNumber: form.get("orderNumber"),
          phone: form.get("phone"),
        }),
      });
      const result: TrackOrderResponse = await response.json();
      if (result.ok) {
        setOrder(result.order);
        setMessage("Order found. Status details are shown below.");
      } else {
        setMessage(result.message || TRACK_ORDER_NOT_FOUND);
      }
    } catch {
      setMessage(
        "Order tracking is temporarily unavailable. Please try again shortly or message us on WhatsApp.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
      {/* Left: lookup form and, once found, the order result. */}
      <div className="min-w-0 space-y-6">
        <Card>
          <CardContent>
            <form
              action="/api/track-order"
              method="post"
              onSubmit={submit}
              className="space-y-5"
              aria-busy={pending}
            >
              <h2 className="font-heading text-h3 font-semibold">
                Enter your details
              </h2>
              <div className="space-y-2">
                <Label htmlFor="track-order-number">Order number</Label>
                <Input
                  id="track-order-number"
                  name="orderNumber"
                  maxLength={32}
                  required
                  autoComplete="off"
                  placeholder="AP-2026-0001"
                  aria-describedby="track-order-number-hint track-order-help track-order-message"
                  className="min-h-12"
                />
                <p
                  id="track-order-number-hint"
                  className="text-muted-foreground text-xs"
                >
                  From your order confirmation page.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="track-order-phone">
                  Phone number used at checkout
                </Label>
                <Input
                  id="track-order-phone"
                  name="phone"
                  type="tel"
                  inputMode="tel"
                  maxLength={32}
                  required
                  autoComplete="tel"
                  placeholder="03XX XXXXXXX"
                  aria-describedby="track-order-phone-hint track-order-help track-order-message"
                  className="min-h-12"
                />
                <p
                  id="track-order-phone-hint"
                  className="text-muted-foreground text-xs"
                >
                  The number you entered at checkout.
                </p>
              </div>
              <p id="track-order-help" className="text-muted-foreground text-sm">
                Enter both details. Phone numbers starting with 03, +92, or 92 are
                accepted. We will not display your contact or delivery details.
              </p>
              <Button
                type="submit"
                disabled={pending}
                className="min-h-12 w-full sm:w-auto"
              >
                {pending ? "Finding your order…" : "Track my order"}
              </Button>
              <p
                id="track-order-message"
                role="status"
                aria-live="polite"
                className="text-foreground text-sm"
              >
                {pending ? "Checking your details…" : message}
              </p>
            </form>
          </CardContent>
        </Card>
        {order && (
          <Card>
            <CardContent className="min-w-0 space-y-6">
              <div>
                <h2 className="font-heading text-h3 font-semibold break-words">
                  Order {order.orderNumber}
                </h2>
                <p className="text-muted-foreground mt-2">
                  {trackOrderStatusMessages[order.status]}
                </p>
              </div>
              {/* Same tracker wrapper as the order confirmation page. */}
              <div className="border-silver bg-card rounded-2xl border px-4 py-6 shadow-soft sm:px-8">
                <OrderStatusTracker status={order.status} />
              </div>
              {(order.courierName || order.trackingNumber) && (
                <section className="space-y-2">
                  <h3 className="font-semibold">Delivery tracking</h3>
                  {order.courierName && (
                    <p className="break-words">Courier: {order.courierName}</p>
                  )}
                  {order.trackingNumber && (
                    <>
                      <p className="break-all">
                        Tracking number: {order.trackingNumber}
                      </p>
                      <CopyButton
                        text={order.trackingNumber}
                        label="Copy tracking number"
                      />
                    </>
                  )}
                </section>
              )}
              <section>
                <h3 className="font-semibold">Status updates</h3>
                <p className="text-muted-foreground text-sm">
                  All times are in Asia/Karachi.
                </p>
                <ol className="mt-3 space-y-2 text-sm">
                  {order.timestamps.map((entry, index) => (
                    <li
                      key={`${entry.at}-${index}`}
                      className="flex flex-wrap justify-between gap-x-4 gap-y-1"
                    >
                      <span>{orderStatusLabels[entry.status]}</span>
                      <time dateTime={entry.at} className="text-muted-foreground">
                        {formatKarachiDateTime(new Date(entry.at))}
                      </time>
                    </li>
                  ))}
                </ol>
              </section>
              <section>
                <h3 className="font-semibold">Your items</h3>
                <ul className="divide-border mt-3 divide-y">
                  {order.items.map((item, index) => (
                    <li key={index} className="py-3 break-words">
                      <p className="font-medium">{item.productTitle}</p>
                      <p className="text-muted-foreground text-sm">
                        {item.variantLabel} · Quantity {item.quantity}
                      </p>
                    </li>
                  ))}
                </ul>
                <p className="border-border flex flex-wrap justify-between gap-3 border-t pt-4 font-semibold">
                  <span>Order total</span>
                  <span>{formatPrice(order.total)}</span>
                </p>
              </section>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Right: help and a plain-language status legend. */}
      <aside className="space-y-6 lg:sticky lg:top-28">
        <Card>
          <CardContent className="space-y-4">
            <span className="bg-gold/20 text-gold-text dark:text-gold-light inline-flex size-11 items-center justify-center rounded-xl">
              <PackageSearch aria-hidden="true" className="size-5" />
            </span>
            <div className="space-y-2">
              <h2 className="font-heading text-lg font-semibold">
                Where do I find my order number?
              </h2>
              <p className="text-muted-foreground text-sm leading-6">
                It is shown on the order confirmation page right after checkout.
                It looks like AP-2026-0001. Keep it handy to track your order here.
              </p>
            </div>
            {whatsapp && (
              <div className="border-silver space-y-2 border-t pt-4">
                <h3 className="text-sm font-semibold">Need help?</h3>
                <Button
                  nativeButton={false}
                  variant="outline"
                  className="min-h-11 w-full"
                  render={
                    <a href={whatsapp} target="_blank" rel="noopener noreferrer" />
                  }
                >
                  <MessageCircle aria-hidden="true" data-icon="inline-start" />
                  Message us on WhatsApp
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-3">
            <h2 className="font-heading text-lg font-semibold">
              What each status means
            </h2>
            <ul className="space-y-2.5">
              {statusMeanings.map(({ label, tone, text }) => (
                <li key={label} className="flex items-start gap-2.5 text-sm">
                  <span
                    aria-hidden="true"
                    className={`mt-1.5 size-2 shrink-0 rounded-full bg-current ${tone}`}
                  />
                  <span className="leading-6">
                    <span className={`font-semibold ${tone}`}>{label}</span>{" "}
                    <span className="text-muted-foreground">— {text}</span>
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}