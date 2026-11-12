import { CircleAlert, Info, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "cn";

/**
 * Shared callout for important notes on info pages. "note" is the gold brand
 * tint; "warning" uses the destructive tint. Dashed borders mark draft notes
 * that still carry a TODO(owner) marker.
 */
export function Callout({
  children,
  tone = "note",
  dashed = false,
  icon: Icon,
}: {
  children: ReactNode;
  tone?: "note" | "warning";
  dashed?: boolean;
  icon?: LucideIcon;
}) {
  const ResolvedIcon = Icon ?? (tone === "warning" ? CircleAlert : Info);
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-xl border p-4 text-sm leading-6",
        tone === "warning"
          ? "border-destructive/30 bg-destructive/10 text-destructive"
          : "border-gold/40 bg-gold/10 text-foreground",
        dashed && "border-dashed",
      )}
    >
      <ResolvedIcon
        aria-hidden="true"
        className={cn(
          "mt-0.5 size-5 shrink-0",
          tone === "warning"
            ? "text-destructive"
            : "text-gold-text dark:text-gold-light",
        )}
      />
      <div className="min-w-0 space-y-1">{children}</div>
    </div>
  );
}