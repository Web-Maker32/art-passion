"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateAdminVariantStock } from "@/actions/admin-products";
import { Button } from "@/components/ui/button";

const stockInputClass =
  "h-11 w-20 rounded-lg border border-input bg-transparent px-2 text-sm text-foreground transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";

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
  const [loadedStock, setLoadedStock] = useState(stock);
  const [value, setValue] = useState(String(stock));
  const [isPending, startTransition] = useTransition();

  // Re-sync the baseline when the list refreshes with a new stock value.
  // Adjusting state during render (instead of in an effect) avoids a
  // cascading extra render pass.
  const [prevStock, setPrevStock] = useState(stock);
  if (stock !== prevStock) {
    setPrevStock(stock);
    setLoadedStock(stock);
    setValue(String(stock));
  }

  const dirty = value.trim() !== "" && Number(value) !== loadedStock;

  function commit() {
    const nextStock = Number(value);
    if (!Number.isInteger(nextStock) || nextStock < 0) {
      toast.error("Stock must be a whole number of 0 or more.");
      setValue(String(loadedStock));
      return;
    }
    if (nextStock === loadedStock) return;
    startTransition(async () => {
      const result = await updateAdminVariantStock({
        variantId,
        stock: nextStock,
        loadedStock,
      });
      if (result.success) {
        toast.success(result.message);
        setLoadedStock(nextStock);
      } else {
        toast.error(result.message);
        setValue(String(loadedStock));
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
          size="sm"
          type="button"
          variant="outline"
        >
          {isPending ? "Saving…" : "Save"}
        </Button>
      )}
    </span>
  );
}
