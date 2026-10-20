"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  clearCartAction,
  removeCartItem,
  updateCartItem,
} from "@/actions/cart";
import { Button } from "@/components/ui/button";

export function CartItemControls({
  itemId,
  productTitle,
  variantLabel,
  quantity,
  maxQuantity,
  available,
  editable,
}: {
  itemId: string;
  productTitle: string;
  variantLabel: string;
  quantity: number;
  maxQuantity: number;
  available: boolean;
  editable: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [announcement, setAnnouncement] = useState("");

  function changeQuantity(nextQuantity: number) {
    startTransition(async () => {
      const result = await updateCartItem({ itemId, quantity: nextQuantity });
      setAnnouncement(result.message);
      if (!result.ok) toast.error(result.message);
      router.refresh();
    });
  }

  function remove() {
    startTransition(async () => {
      const result = await removeCartItem({ itemId });
      setAnnouncement(result.message);
      if (result.ok) toast.success(result.message);
      else toast.error(result.message);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center rounded-md border border-input">
        <button
          aria-label={`Decrease quantity of ${productTitle}, ${variantLabel}`}
          className="min-h-11 min-w-11 rounded-l-md transition-colors duration-interaction hover-fine:hover:bg-muted active:bg-muted/80 focus-visible:outline-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50"
          disabled={pending || !editable || quantity <= 1}
          onClick={() => changeQuantity(quantity - 1)}
          type="button"
        >
          −
        </button>
        <span
          aria-label={`Quantity of ${productTitle}, ${variantLabel}`}
          aria-live="polite"
          className="min-w-10 text-center"
          role="status"
        >
          {quantity}
        </span>
        <button
          aria-label={`Increase quantity of ${productTitle}, ${variantLabel}`}
          className="min-h-11 min-w-11 rounded-r-md transition-colors duration-interaction hover-fine:hover:bg-muted active:bg-muted/80 focus-visible:outline-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50"
          disabled={pending || !available || quantity >= maxQuantity}
          onClick={() => changeQuantity(quantity + 1)}
          type="button"
        >
          +
        </button>
      </div>
      <Button
        disabled={pending}
        onClick={remove}
        type="button"
        className="min-h-11 px-3 hover-fine:hover:text-blush hover-fine:hover:bg-blush/10"
        variant="ghost"
      >
        Remove
      </Button>
      <span aria-live="polite" className="sr-only">
        {announcement}
      </span>
    </div>
  );
}

export function ClearCartButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      className="min-h-11 px-3"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          const result = await clearCartAction();
          if (result.ok) toast.success(result.message);
          else toast.error(result.message);
          router.refresh();
        });
      }}
      type="button"
      variant="ghost"
    >
      {pending ? "Clearing..." : "Clear cart"}
    </Button>
  );
}
