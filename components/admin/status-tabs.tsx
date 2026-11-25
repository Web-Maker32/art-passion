"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronRight } from "lucide-react";

export type StatusTabItem = {
  value: string;
  href: string;
  label: string;
  count: number;
  active: boolean;
};

/**
 * Horizontally scrollable status tabs. When the row overflows, a right-edge
 * fade with a chevron hints at more tabs; it disappears once scrolled to the
 * end. Measurement runs in scroll/resize callbacks, never during render.
 */
export function StatusTabs({
  tabs,
  ariaLabel,
}: {
  tabs: StatusTabItem[];
  ariaLabel: string;
}) {
  const navRef = useRef<HTMLElement | null>(null);
  const [overflowing, setOverflowing] = useState(false);
  const [atEnd, setAtEnd] = useState(false);

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const measure = () => {
      setOverflowing(nav.scrollWidth > nav.clientWidth + 1);
      setAtEnd(nav.scrollLeft + nav.clientWidth >= nav.scrollWidth - 1);
    };
    const frame = requestAnimationFrame(measure);
    nav.addEventListener("scroll", measure, { passive: true });
    const observer = new ResizeObserver(measure);
    observer.observe(nav);
    return () => {
      cancelAnimationFrame(frame);
      nav.removeEventListener("scroll", measure);
      observer.disconnect();
    };
  }, []);

  return (
    // overflow-x-clip keeps the tabs' scrollable overflow (incl. sr-only
    // spans) inside the nav instead of widening the page; the nav itself
    // still scrolls horizontally.
    <div className="relative overflow-x-clip">
      <nav
        aria-label={ariaLabel}
        className="scrollbar-brand flex gap-1.5 overflow-x-auto pb-1"
        ref={navRef}
      >
        {tabs.map((tab) => (
          <Link
            key={tab.value}
            href={tab.href}
            aria-current={tab.active ? "true" : undefined}
            className={`inline-flex h-11 shrink-0 items-center gap-2 rounded-full border px-3.5 text-sm font-medium whitespace-nowrap transition-colors motion-reduce:transition-none sm:h-9 ${
              tab.active
                ? "bg-brand text-brand-foreground border-transparent"
                : "border-silver bg-card hover-fine:hover:bg-muted"
            }`}
          >
            {tab.label}
            <span
              className={`rounded-full px-2 text-xs tabular-nums ${
                tab.active ? "bg-brand-foreground/20" : "bg-foreground/10"
              } ${tab.count === 0 ? "opacity-50" : ""}`}
            >
              {tab.count}
              <span className="sr-only"> orders</span>
            </span>
          </Link>
        ))}
      </nav>
      {overflowing && !atEnd && (
        <span
          aria-hidden="true"
          className="from-background pointer-events-none absolute inset-y-0 right-0 flex w-12 items-center justify-end bg-gradient-to-l to-transparent pr-1"
        >
          <ChevronRight className="text-muted-foreground size-4" />
        </span>
      )}
    </div>
  );
}
