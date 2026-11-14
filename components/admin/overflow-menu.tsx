"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { MoreHorizontal } from "lucide-react";
import { cn } from "cn";

/**
 * Overflow "..." menu built on native <details>: keyboard accessible without
 * any extra library. Escape closes and refocuses the trigger, arrow keys move
 * between items, clicking outside or activating an item closes the menu.
 */
export const overflowMenuItemClass =
  "flex min-h-11 w-full items-center gap-2.5 rounded-[8px] px-3 text-left text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:bg-muted sm:min-h-10 [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-muted-foreground";

export function OverflowMenu({
  label = "More actions",
  children,
  className,
  menuClassName,
}: {
  label?: string;
  children: ReactNode;
  className?: string;
  menuClassName?: string;
}) {
  const detailsRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      const details = detailsRef.current;
      if (
        details?.open &&
        event.target instanceof Node &&
        !details.contains(event.target)
      ) {
        details.open = false;
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  function close() {
    const details = detailsRef.current;
    if (details) details.open = false;
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLDetailsElement>) {
    const details = detailsRef.current;
    if (!details?.open) return;

    if (event.key === "Escape") {
      event.preventDefault();
      close();
      details.querySelector("summary")?.focus();
      return;
    }

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      const items = Array.from(
        details.querySelectorAll<HTMLElement>('[role="menuitem"]'),
      );
      if (items.length === 0) return;
      event.preventDefault();
      const current = items.indexOf(document.activeElement as HTMLElement);
      const next =
        current === -1
          ? event.key === "ArrowDown"
            ? 0
            : items.length - 1
          : (current + (event.key === "ArrowDown" ? 1 : -1) + items.length) %
            items.length;
      items[next]?.focus();
    }
  }

  return (
    <details
      className={cn("group/overflow relative", className)}
      onKeyDown={onKeyDown}
      onBlur={(event: React.FocusEvent<HTMLDetailsElement>) => {
        const details = detailsRef.current;
        if (details && !details.contains(event.relatedTarget as Node | null)) {
          details.open = false;
        }
      }}
      ref={detailsRef}
    >
      <summary
        aria-haspopup="menu"
        aria-label={label}
        className="text-muted-foreground hover:bg-muted hover:text-foreground group-open/overflow:bg-muted group-open/overflow:text-foreground flex size-11 cursor-pointer list-none items-center justify-center rounded-[8px] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)] sm:size-9 [&::-webkit-details-marker]:hidden"
      >
        <MoreHorizontal aria-hidden="true" className="size-4" />
      </summary>
      <div
        aria-label={label}
        className={cn(
          "border bg-popover absolute top-full right-0 z-30 mt-1 w-52 rounded-[12px] p-1 shadow-card",
          menuClassName,
        )}
        onClick={(event) => {
          if ((event.target as HTMLElement).closest('[role="menuitem"]')) {
            close();
          }
        }}
        role="menu"
      >
        {children}
      </div>
    </details>
  );
}