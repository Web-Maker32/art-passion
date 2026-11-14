import type { ComponentProps } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "cn";

/**
 * Shared admin form controls: 44px tall on touch screens, 40px from sm up,
 * 8px radius, 1px border token. The global gold focus rules in globals.css
 * apply to the native input/select elements underneath.
 */
export const adminControlClass =
  "h-11 w-full min-w-0 rounded-[8px] border border-input bg-transparent px-3 text-sm text-foreground transition-colors outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-60 sm:h-10 dark:bg-input/30";

export function AdminInput({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(adminControlClass, className)} {...props} />;
}

/** Multi-line companion to AdminInput: same border, radius and gold focus. */
export function AdminTextarea({
  className,
  ...props
}: ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(adminControlClass, "h-auto min-h-16 py-2 sm:h-auto", className)}
      {...props}
    />
  );
}

/** Native select with a custom chevron — no browser default arrow. */
export function AdminSelect({
  className,
  wrapperClassName,
  children,
  ...props
}: ComponentProps<"select"> & { wrapperClassName?: string }) {
  return (
    <span className={cn("relative block", wrapperClassName)}>
      <select
        className={cn(adminControlClass, "appearance-none pr-9", className)}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden="true"
        className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2"
      />
    </span>
  );
}

/**
 * Toggle chip that replaces a native checkbox in filter forms. The real
 * checkbox stays in the DOM (visually hidden), so GET forms submit exactly
 * the same fields with or without JavaScript.
 */
export function ToggleChip({
  id,
  name,
  label,
  value = "1",
  defaultChecked,
  disabled,
  className,
}: {
  id: string;
  name: string;
  label: string;
  value?: string;
  defaultChecked?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <label className={cn("inline-flex cursor-pointer", className)} htmlFor={id}>
      <input
        className="peer sr-only"
        defaultChecked={defaultChecked}
        disabled={disabled}
        id={id}
        name={name}
        type="checkbox"
        value={value}
      />
      <span
        className={cn(
          "border-input text-muted-foreground inline-flex h-11 items-center gap-2 rounded-[8px] border px-3.5 text-sm font-medium whitespace-nowrap transition-colors sm:h-10",
          "hover-fine:hover:border-gold peer-checked:border-gold peer-checked:bg-gold/15 peer-checked:text-foreground",
          "peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--focus-ring)]",
          "peer-disabled:cursor-not-allowed peer-disabled:opacity-60",
          "peer-checked:[&>svg]:opacity-100 motion-reduce:transition-none",
        )}
      >
        <Check
          aria-hidden="true"
          className="text-gold-text size-4 opacity-0 transition-opacity dark:text-gold-light motion-reduce:transition-none"
        />
        {label}
      </span>
    </label>
  );
}