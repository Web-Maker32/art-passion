import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "cn";

const base =
  "focus-visible:outline-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-md px-5 text-center font-semibold lift-sm press focus-visible:outline-2 focus-visible:outline-offset-2";

const styles = {
  solid: "bg-brand text-brand-foreground hover-fine:hover:bg-brand-hover",
  outline:
    "border border-silver text-foreground hover-fine:hover:border-brand hover-fine:hover:bg-brand/5",
} as const;

/**
 * Link styled as a call to action. Uses next/link for internal routes and a
 * plain anchor for external URLs such as wa.me and mailto.
 */
export function CtaLink({
  href,
  children,
  variant = "solid",
  className,
}: {
  href: string;
  children: ReactNode;
  variant?: keyof typeof styles;
  className?: string;
}) {
  const classes = cn(base, styles[variant], className);
  const isExternal = /^(https?:|mailto:|tel:)/.test(href);

  if (isExternal) {
    return (
      <a className={classes} href={href} rel="noreferrer" target="_blank">
        {children}
      </a>
    );
  }

  return (
    <Link className={classes} href={href}>
      {children}
    </Link>
  );
}
