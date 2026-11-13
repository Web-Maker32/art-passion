"use client";

import { useState, type FormEvent } from "react";
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
    <div className="space-y-6">
      <Card>
        <CardContent>
          <form
            action="/api/track-order"
            method="post"
            onSubmit={submit}
            className="space-y-5"
            aria-busy={pending}
          >
            <div className="space-y-2">
              <Label htmlFor="track-order-number">Order number</Label>
              <Input
                id="track-order-number"
                name="orderNumber"
                maxLength={32}
                required
                autoComplete="off"
                placeholder="AP-2026-0001"
                aria-describedby="track-order-help track-order-message"
                className="min-h-12"
              />
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
                aria-describedby="track-order-help track-order-message"
                className="min-h-12"
              />
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
            <OrderStatusTracker status={order.status} />
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
      {whatsapp && (
        <Button
          nativeButton={false}
          variant="outline"
          className="min-h-11"
          render={
            <a href={whatsapp} target="_blank" rel="noopener noreferrer" />
          }
        >
          Message us on WhatsApp
        </Button>
      )}
    </div>
  );
}
