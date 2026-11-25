"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Check, MessageCircle, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { addToCart } from "@/actions/cart";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";
import {
  isVariantAvailable,
  maxQuantityForVariant,
  variantStockLabel,
} from "@/lib/availability";
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
  const router = useRouter();
  const [selectedId, setSelectedId] = useState(variants[0]?.id ?? "");
  const [quantity, setQuantity] = useState(1);
  const [isPending, startTransition] = useTransition();
  const selected = variants.find((variant) => variant.id === selectedId);
  const maxQuantity = selected
    ? maxQuantityForVariant({ madeToOrder, stock: selected.stock })
    : 0;
  const stockStatus = selected
    ? variantStockLabel({ madeToOrder, stock: selected.stock })
    : "Out of stock";
  const selectedAvailable = selected
    ? isVariantAvailable({ madeToOrder, stock: selected.stock })
    : false;
  const message = [
    `Hello Art Passion! I have a question about ${productTitle}.`,
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
    <div className="border-silver bg-card shadow-soft space-y-5 rounded-2xl border p-5 sm:p-6">
      {variants.length > 1 ? (
        <fieldset>
          <legend className="mb-2 text-sm font-semibold">
            Choose an option
          </legend>
          <div className="grid gap-2">
            {variants.map((variant) => {
              const selectedVariant = selectedId === variant.id;
              const unavailable = !isVariantAvailable({
                madeToOrder,
                stock: variant.stock,
              });

              return (
                <label
                  className={`duration-interaction ease-interaction active:bg-muted/70 flex min-h-12 items-center justify-between gap-3 rounded-lg border-2 px-3 py-2 transition-colors ${
                    unavailable
                      ? "border-silver-strong bg-muted/60 text-muted-foreground cursor-not-allowed"
                      : `hover-fine:hover:border-brand cursor-pointer ${
                          selectedVariant
                            ? "border-brand bg-brand/5"
                            : "border-silver"
                        }`
                  }`}
                  key={variant.id}
                >
                  <span className="flex items-center gap-2">
                    <input
                      checked={selectedVariant}
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
                    {unavailable && (
                      <span className="text-xs font-medium">Out of stock</span>
                    )}
                  </span>
                  <span className="flex items-center gap-2 font-semibold">
                    {formatPrice(variant.price)}
                    {selectedVariant && (
                      <Check aria-hidden="true" className="size-4" />
                    )}
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>
      ) : selected ? (
        <p className="font-semibold">{selected.label}</p>
      ) : null}

      {selected && (
        <>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="font-heading text-foreground dark:text-gold-light text-2xl font-bold tabular-nums">
              {formatPrice(selected.price)}
            </p>
            <p
              aria-live="polite"
              className={`text-sm font-semibold ${
                stockStatus === "Low stock"
                  ? "text-gold-text"
                  : stockStatus === "Out of stock"
                    ? "text-destructive"
                    : "text-brand dark:text-foreground"
              }`}
            >
              {stockStatus}
            </p>
          </div>
          {madeToOrder && (
            <p className="bg-muted rounded-lg px-3 py-2 text-sm">
              Made to order: ready in {leadTimeDays} days.
            </p>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-semibold">Quantity</span>
            <div className="border-input flex items-center rounded-lg border">
              <button
                aria-label="Decrease quantity"
                className="hover:bg-muted focus-visible:outline-ring min-h-11 min-w-11 rounded-l-lg focus-visible:outline-2"
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
                className="hover:bg-muted focus-visible:outline-ring min-h-11 min-w-11 rounded-r-lg focus-visible:outline-2"
                disabled={quantity >= maxQuantity}
                onClick={() =>
                  setQuantity((value) => Math.min(maxQuantity, value + 1))
                }
                type="button"
              >
                +
              </button>
            </div>
          </div>
          <Button
            aria-busy={isPending}
            className="w-full"
            disabled={isPending || !selectedAvailable}
            onClick={() => {
              startTransition(async () => {
                const result = await addToCart({
                  variantId: selected.id,
                  quantity,
                });
                if (result.ok) {
                  toast.success(result.message, {
                    action: {
                      label: "View cart",
                      onClick: () => router.push("/cart"),
                    },
                  });
                  router.refresh();
                } else {
                  toast.error(result.message);
                }
              });
            }}
            size="lg"
            type="button"
          >
            <ShoppingBag aria-hidden="true" className="size-4" />
            {isPending ? "Adding..." : "Add to cart"}
          </Button>
          {whatsappHref && (
            <a
              className="border-brand text-foreground lift-sm press hover-fine:hover:bg-brand/5 focus-visible:outline-ring flex min-h-12 items-center justify-center gap-2 rounded-lg border px-4 text-center font-semibold focus-visible:outline-2 focus-visible:outline-offset-2"
              href={whatsappHref}
              rel="noopener noreferrer"
              target="_blank"
            >
              <MessageCircle
                aria-hidden="true"
                className="text-brand dark:text-gold-light size-5 shrink-0"
              />
              Ask about this product on WhatsApp
            </a>
          )}
        </>
      )}
    </div>
  );
}
