import Link from "next/link";
import { ChevronRight } from "lucide-react";

export type BreadcrumbItem = { name: string; path: string };

/**
 * Compact visible trail that mirrors the breadcrumb JSON-LD. The final item is
 * the current page (aria-current) and is not a link. Wraps on narrow screens.
 */
export function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-5">
      <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={item.path} className="flex items-center gap-1.5">
              {index > 0 && (
                <ChevronRight
                  aria-hidden="true"
                  className="text-muted-foreground/70 size-3.5 shrink-0"
                />
              )}
              {isLast ? (
                <span
                  aria-current="page"
                  className="text-foreground font-semibold"
                >
                  {item.name}
                </span>
              ) : (
                <Link
                  className="text-muted-foreground hover:text-brand focus-visible:outline-ring inline-flex min-h-8 items-center rounded-sm transition-colors duration-interaction focus-visible:outline-2 focus-visible:outline-offset-2"
                  href={item.path}
                >
                  {item.name}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}