"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateAdminVariantStock } from "@/actions/admin-products";
import { Button } from "@/components/ui/button";

const stockInputClass =
  "h-8 w-20 rounded-lg border border-input bg-transparent px-2 text-sm text-foreground transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";

/**
 * Inline per-variant stock editor used on the admin product list. Keeps a
 * local draft value and commits through a server action with a toast.
 */
export function VariantQuickStock({
  variantId,
  variantLabel,
  stock,
}: {
  variantId: string;
  variantLabel: string;
  stock: number;
}) {
  const [value, setValue] = useState(String(stock));
  const [isPending, startTransition] = useTransition();

  const dirty = value.trim() !== "" && Number(value) !== stock;

  function commit() {
    const nextStock = Number(value);
    if (!Number.isInteger(nextStock) || nextStock < 0) {
      toast.error("Stock must be a whole number of 0 or more.");
      setValue(String(stock));
      return;
    }
    startTransition(async () => {
      const result = await updateAdminVariantStock({
        variantId,
        stock: nextStock,
      });
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
        setValue(String(stock));
      }
    });
  }

  return (
    <span className="inline-flex items-center gap-1.5">
      <input
        aria-label={`Stock for ${variantLabel}`}
        className={stockInputClass}
        disabled={isPending}
        inputMode="numeric"
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            commit();
          }
        }}
        type="number"
        min={0}
        step={1}
        value={value}
      />
      {dirty && (
        <Button
          disabled={isPending}
          onClick={commit}
          size="xs"
          type="button"
          variant="outline"
        >
          {isPending ? "Saving…" : "Save"}
        </Button>
      )}
    </span>
  );
}
