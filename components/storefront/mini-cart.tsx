"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { cn } from "cn";
import { CartCountBadge } from "@/components/storefront/cart-count-badge";
import { FreeDeliveryProgress } from "@/components/storefront/free-delivery-progress";
import { buttonVariants } from "@/components/ui/button";
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

export function MiniCart({
  cart,
  deliveryFee,
  freeDeliveryThreshold,
}: {
  cart: CartView;
  deliveryFee: number;
  freeDeliveryThreshold: number;
}) {
  const countLabel =
    cart.itemCount > 99 ? "99+" : String(cart.itemCount);
  const total = cart.subtotal + deliveryFee;

  return (
    <Sheet>
      <SheetTrigger
        aria-label={`Shopping cart, ${cart.itemCount} items`}
        className="text-brand-foreground hover:text-gold-light focus-visible:outline-gold-light relative inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg p-2 transition-colors duration-interaction hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2"
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
          <ul className="scrollbar-brand min-h-0 flex-1 space-y-4 overflow-y-auto px-4">
            {cart.items.map((item) => (
              <li
                className="flex gap-3 border-b border-border pb-4 transition-colors duration-interaction hover-fine:hover:bg-muted/60"
                key={item.itemId}
              >
                <div className="bg-muted relative size-16 shrink-0 overflow-hidden rounded-lg">
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
                    <p className="text-gold-text dark:text-gold-light mt-1 text-xs font-medium">
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
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-10 text-center">
            <span className="bg-gold/20 text-gold-text dark:text-gold-light inline-flex size-14 items-center justify-center rounded-2xl">
              <ShoppingBag aria-hidden="true" className="size-6" />
            </span>
            <p className="text-muted-foreground max-w-xs">
              Your cart is empty. Find something lovely to make or gift.
            </p>
            <SheetClose
              nativeButton={false}
              render={
                <Link
                  className={cn(buttonVariants({ variant: "outline" }))}
                  href="/products"
                />
              }
            >
              Continue shopping
            </SheetClose>
          </div>
        )}
        <SheetFooter className="border-t border-border">
          <FreeDeliveryProgress
            deliveryFee={deliveryFee}
            subtotal={cart.subtotal}
            threshold={freeDeliveryThreshold}
          />
          <dl className="space-y-2 text-sm">
            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd className="font-semibold">{formatPrice(cart.subtotal)}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted-foreground">Delivery</dt>
              <dd className="font-semibold">
                {deliveryFee ? formatPrice(deliveryFee) : "Free"}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4 border-t border-border pt-2 text-base font-bold">
              <dt>Total</dt>
              <dd>{formatPrice(total)}</dd>
            </div>
          </dl>
          {cart.unavailableCount > 0 && (
            <p className="text-destructive text-sm" role="status">
              Remove or update unavailable items before checkout.
            </p>
          )}
          {cart.items.some((item) => item.message) &&
            cart.unavailableCount === 0 && (
              <p className="text-destructive text-sm" role="status">
                Review updated prices before checkout.
              </p>
            )}
          <SheetClose
            nativeButton={false}
            render={
              <Link
                className={cn(buttonVariants({ variant: "outline" }), "w-full")}
                href="/cart"
              />
            }
          >
            View cart
          </SheetClose>
          <SheetClose
            nativeButton={false}
            render={
              <Link
                className={cn(buttonVariants(), "w-full")}
                href="/checkout"
              />
            }
          >
            Checkout
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}