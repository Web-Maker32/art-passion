"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { CartCountBadge } from "@/components/storefront/cart-count-badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { formatPrice } from "@/lib/format";
import type { CartView } from "@/lib/cart-types";

export function MiniCart({ cart }: { cart: CartView }) {
  const countLabel =
    cart.itemCount > 99 ? "99+" : String(cart.itemCount);

  return (
    <Sheet>
      <SheetTrigger
        aria-label={`Shopping cart, ${cart.itemCount} items`}
        className="text-brand-foreground hover:text-gold-light focus-visible:outline-gold-light relative inline-flex min-h-11 min-w-11 items-center justify-center rounded-md p-2 transition-colors duration-interaction hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2"
        render={<button type="button" />}
      >
        <ShoppingBag aria-hidden="true" className="size-5" />
        {cart.itemCount > 0 && (
          <CartCountBadge key={cart.itemCount} label={countLabel} />
        )}
      </SheetTrigger>
      <SheetContent
        aria-label="Shopping cart"
        className="bg-background flex w-full flex-col sm:max-w-md"
      >
        <SheetHeader className="border-b border-border pr-12">
          <SheetTitle className="font-brand-display text-xl">
            Your cart
          </SheetTitle>
          <SheetDescription aria-live="polite">
            {cart.itemCount} {cart.itemCount === 1 ? "item" : "items"}
          </SheetDescription>
        </SheetHeader>
        {cart.items.length ? (
          <ul className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4">
            {cart.items.map((item) => (
              <li
                className="flex gap-3 border-b border-border pb-4"
                key={item.itemId}
              >
                <div className="bg-muted relative size-16 shrink-0 overflow-hidden rounded-md">
                  <Image
                    alt={item.imageAlt}
                    className="object-cover"
                    fill
                    sizes="64px"
                    src={item.imageUrl || "/placeholder.svg"}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 font-medium">
                    {item.productTitle}
                  </p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    {item.variantLabel} · Qty {item.quantity}
                  </p>
                  {item.message && (
                    <p className="text-gold-text mt-1 text-xs font-medium">
                      {item.message}
                    </p>
                  )}
                </div>
                <p className="shrink-0 text-right font-semibold">
                  {formatPrice(item.lineTotal)}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground flex-1 px-4 py-8">
            Your cart is empty. Find something lovely to make or gift.
          </p>
        )}
        <SheetFooter className="border-t border-border">
          <div className="flex items-center justify-between gap-4 text-base font-semibold">
            <span>Subtotal</span>
            <span>{formatPrice(cart.subtotal)}</span>
          </div>
          {cart.unavailableCount > 0 && (
            <p className="text-destructive text-sm" role="status">
              Remove or update unavailable items before checkout.
            </p>
          )}
          <SheetClose
            render={
              <Link
                className="bg-primary text-primary-foreground hover:bg-primary-hover focus-visible:outline-ring inline-flex min-h-11 items-center justify-center rounded-md px-4 py-2 font-semibold focus-visible:outline-2 focus-visible:outline-offset-2"
                href="/cart"
              />
            }
          >
            View cart
          </SheetClose>
          <Button className="min-h-11 w-full" disabled type="button">
            Checkout
          </Button>
          <p className="text-muted-foreground text-center text-xs">
            Checkout is coming soon.
          </p>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
