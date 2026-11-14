import Link from "next/link";
import type { ComponentProps } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "cn";

/** Quiet icon-only controls (copy, print, more). Always pass a label. */
const quietClass = "text-muted-foreground hover:text-foreground";

export function IconButton({
  label,
  className,
  children,
  ...props
}: ComponentProps<typeof Button> & { label: string }) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label={label}
      className={cn(quietClass, className)}
      {...props}
    >
      {children}
    </Button>
  );
}

export function IconButtonLink({
  label,
  className,
  children,
  ...props
}: ComponentProps<typeof Link> & { label: string }) {
  return (
    <Link
      aria-label={label}
      className={cn(
        buttonVariants({ variant: "ghost", size: "icon-sm" }),
        quietClass,
        className,
      )}
      {...props}
    >
      {children}
    </Link>
  );
}