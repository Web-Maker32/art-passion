"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";
import { buildWhatsAppLink } from "@/lib/whatsapp";

type PurchaseVariant = {
  id: string;
  label: string;
  price: number;
  stock: number;
};

export function ProductPurchasePanel({
  productTitle,
  productUrl,
  whatsappNumber,
  variants,
  madeToOrder,
  leadTimeDays,
}: {
  productTitle: string;
  productUrl: string;
  whatsappNumber?: string;
  variants: PurchaseVariant[];
  madeToOrder: boolean;
  leadTimeDays: number;
}) {
  const [selectedId, setSelectedId] = useState(variants[0]?.id ?? "");
  const [quantity, setQuantity] = useState(1);
  const selected = variants.find((variant) => variant.id === selectedId);
  const stockStatus =
    !selected || selected.stock === 0
      ? "Out of stock"
      : selected.stock <= 5
        ? "Low stock"
        : "In stock";
  const message = [
    `Hello Art Passion! I am interested in ${productTitle}.`,
    selected ? `Variant: ${selected.label}.` : "",
    `Quantity: ${quantity}.`,
    `Product: ${productUrl}`,
  ]
    .filter(Boolean)
    .join(" ");
  const whatsappHref = buildWhatsAppLink({
    number: whatsappNumber,
    message,
  });

  return (
    <div className="space-y-5 rounded-2xl border border-silver bg-card p-5 sm:p-6">
      {variants.length > 1 ? (
        <fieldset>
          <legend className="mb-2 text-sm font-semibold">Choose an option</legend>
          <div className="grid gap-2">
            {variants.map((variant) => (
              <label
                className={`flex min-h-12 cursor-pointer items-center justify-between gap-3 rounded-lg border px-3 py-2 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ring ${
                  selectedId === variant.id
                    ? "border-brand bg-brand/5"
                    : "border-silver"
                }`}
                key={variant.id}
              >
                <span className="flex items-center gap-2">
                  <input
                    checked={selectedId === variant.id}
                    className="accent-brand"
                    name="product-variant"
                    onChange={() => {
                      setSelectedId(variant.id);
                      setQuantity(1);
                    }}
                    type="radio"
                    value={variant.id}
                  />
                  <span className="font-medium">{variant.label}</span>
                </span>
                <span className="font-semibold">{formatPrice(variant.price)}</span>
              </label>
            ))}
          </div>
        </fieldset>
      ) : selected ? (
        <p className="font-semibold">{selected.label}</p>
      ) : null}

      {selected && (
        <>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="font-heading text-2xl font-bold text-brand">
              {formatPrice(selected.price)}
            </p>
            <p
              aria-live="polite"
              className={`text-sm font-semibold ${
                selected.stock <= 5 && selected.stock > 0
                  ? "text-gold-text"
                  : selected.stock === 0
                    ? "text-destructive"
                    : "text-brand"
              }`}
            >
              {stockStatus}
            </p>
          </div>
          {madeToOrder && (
            <p className="rounded-lg bg-muted px-3 py-2 text-sm">
              Made to order: ready in {leadTimeDays} days.
            </p>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-semibold">Quantity</span>
            <div className="flex items-center rounded-md border border-input">
              <button
                aria-label="Decrease quantity"
                className="min-h-11 min-w-11 rounded-l-md hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring"
                disabled={quantity <= 1}
                onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                type="button"
              >
                −
              </button>
              <span aria-live="polite" className="min-w-10 text-center">
                {quantity}
              </span>
              <button
                aria-label="Increase quantity"
                className="min-h-11 min-w-11 rounded-r-md hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring"
                onClick={() => setQuantity((value) => Math.min(99, value + 1))}
                type="button"
              >
                +
              </button>
            </div>
          </div>
          {/* TODO: Enable add-to-cart when cart functionality is implemented in Phase 3. */}
          <Button className="min-h-12 w-full" disabled type="button">
            Add to cart
          </Button>
          {whatsappHref && (
            <a
              className="flex min-h-12 items-center justify-center rounded-md border border-brand px-4 text-center font-semibold text-brand transition-colors hover:bg-brand/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              href={whatsappHref}
              rel="noreferrer"
              target="_blank"
            >
              Order on WhatsApp
            </a>
          )}
        </>
      )}
    </div>
  );
}
