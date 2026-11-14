import Link from "next/link";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "cn";

/**
 * Shared metric card: icon chip, 13px muted label, 28px tabular number and a
 * small hint. Pass href to make the whole card a link to the matching filter.
 * Use tone="gold"/"danger" only when the number actually needs attention.
 */
export type StatCardTone = "default" | "gold" | "danger" | "teal";

const cardTones: Record<StatCardTone, string> = {
  default: "",
  gold: "border-gold/40",
  danger: "border-status-cancelled/40",
  teal: "border-status-shipped/40",
};

const iconTones: Record<StatCardTone, string> = {
  default: "bg-muted text-muted-foreground",
  gold: "bg-gold/15 text-gold-text dark:text-gold-light",
  danger: "bg-status-cancelled/12 text-status-cancelled",
  teal: "bg-status-shipped/12 text-status-shipped",
};

export function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  href,
  tone = "default",
  className,
}: {
  icon?: LucideIcon;
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  href?: string;
  tone?: StatCardTone;
  className?: string;
}) {
  const body = (
    <>
      <span className="flex items-center gap-3">
        {Icon && (
          <span
            aria-hidden="true"
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-[8px]",
              iconTones[tone],
            )}
          >
            <Icon className="size-4" />
          </span>
        )}
        <span className="text-muted-foreground text-[13px] font-medium">
          {label}
        </span>
      </span>
      <span className="mt-3 block text-[28px] leading-none font-semibold tabular-nums">
        {value}
      </span>
      {hint && (
        <span className="text-muted-foreground mt-2 block text-xs leading-4">
          {hint}
        </span>
      )}
    </>
  );

  const classes = cn("block rounded-[12px] border bg-card p-4", cardTones[tone], className);

  if (href) {
    return (
      <Link
        href={href}
        className={cn(
          classes,
          "lift-sm hover-fine:hover:border-gold/50 hover-fine:hover:bg-muted/30",
        )}
      >
        {body}
      </Link>
    );
  }
  return <div className={classes}>{body}</div>;
}