import type { ReactNode } from "react";
import { cn } from "cn";

const widths = {
  /** Storefront content width (80rem). */
  default: "max-w-7xl",
  /** Long-form reading width for info pages. */
  narrow: "max-w-3xl",
  /** Full-bleed feature width. */
  wide: "max-w-[90rem]",
} as const;

export function Container({
  children,
  className = "",
  size = "default",
}: {
  children: ReactNode;
  className?: string;
  size?: keyof typeof widths;
}) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-4 sm:px-6 lg:px-8",
        widths[size],
        className,
      )}
    >
      {children}
    </div>
  );
}
