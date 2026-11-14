import type { ReactNode } from "react";
import { cn } from "cn";

/** Small inline label chip. Tones reuse the mode-aware status/gold tokens. */
export type ChipTone =
  | "neutral"
  | "gold"
  | "teal"
  | "outline"
  | "success"
  | "warning"
  | "danger";

const chipTones: Record<ChipTone, string> = {
  neutral: "bg-muted text-muted-foreground",
  gold: "border-gold/30 bg-gold/15 text-gold-text dark:text-gold-light",
  teal: "border-status-shipped/30 bg-status-shipped/12 text-status-shipped",
  outline: "border-border text-muted-foreground",
  success:
    "border-status-delivered/30 bg-status-delivered/12 text-status-delivered",
  warning: "border-status-pending/30 bg-status-pending/12 text-status-pending",
  danger: "border-status-cancelled/30 bg-status-cancelled/12 text-status-cancelled",
};

export function Chip({
  tone = "neutral",
  className,
  children,
}: {
  tone?: ChipTone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-6 shrink-0 items-center gap-1 rounded-full border border-transparent px-2.5 text-xs font-medium whitespace-nowrap",
        chipTones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}