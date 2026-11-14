import type { ReactNode } from "react";
import { PackageOpen, type LucideIcon } from "lucide-react";
import { cn } from "cn";

/** Branded empty state: gold icon chip, short title, muted hint, optional action. */
export function AdminEmptyState({
  icon: Icon = PackageOpen,
  title,
  description,
  action,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center px-6 py-12 text-center",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="text-gold-text dark:bg-gold/15 dark:text-gold-light flex size-12 items-center justify-center rounded-full bg-gold/12"
      >
        <Icon className="size-5" />
      </span>
      <p className="mt-4 text-sm font-semibold">{title}</p>
      {description && (
        <p className="text-muted-foreground mt-1 max-w-sm text-[13px] leading-5">
          {description}
        </p>
      )}
      {action && (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          {action}
        </div>
      )}
    </div>
  );
}