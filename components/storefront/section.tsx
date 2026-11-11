import type { ComponentProps } from "react";
import { cn } from "cn";

/**
 * Shared vertical rhythm for storefront sections. Keeps a consistent
 * spacing scale (56px mobile, 64px small, 96px large) so pages feel calm and
 * even. Pass `aria-labelledby` to tie the section to its heading.
 */
export function Section({
  className,
  children,
  ...props
}: ComponentProps<"section">) {
  return (
    <section className={cn("py-14 sm:py-16 lg:py-24", className)} {...props}>
      {children}
    </section>
  );
}