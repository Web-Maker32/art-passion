import Link from "next/link";
import { cn } from "cn";
import type { StoreCategory } from "@/lib/queries/categories";

const chipBase =
  "inline-flex min-h-11 items-center whitespace-nowrap rounded-full border px-4 text-sm font-semibold transition-colors duration-interaction ease-interaction focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

/**
 * Quick category switcher shown above the shop and category grids. Chips link
 * to the dedicated collection pages (and "All" to the full shop) so browsing
 * stays predictable. Scrolls sideways on phones and wraps on larger screens.
 */
export function CategoryChips({
  categories,
  activeSlug,
  className,
}: {
  categories: StoreCategory[];
  activeSlug?: string;
  className?: string;
}) {
  return (
    <nav
      aria-label="Shop categories"
      className={cn(
        "scrollbar-brand -mx-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:overflow-visible sm:px-0 sm:pb-0",
        className,
      )}
    >
      <ul className="flex min-w-max items-center gap-2 sm:min-w-0 sm:flex-wrap">
        <li>
          <Link
            aria-current={activeSlug ? undefined : "page"}
            className={cn(
              chipBase,
              activeSlug
                ? "border-silver bg-card text-foreground hover-fine:hover:border-brand-gold hover-fine:hover:text-brand"
                : "border-brand bg-brand text-brand-foreground shadow-soft",
            )}
            href="/products"
          >
            All pieces
          </Link>
        </li>
        {categories.map((category) => {
          const active = category.slug === activeSlug;
          return (
            <li key={category.id}>
              <Link
                aria-current={active ? "page" : undefined}
                className={cn(
                  chipBase,
                  active
                    ? "border-brand bg-brand text-brand-foreground shadow-soft"
                    : "border-silver bg-card text-foreground hover-fine:hover:border-brand-gold hover-fine:hover:text-brand",
                )}
                href={`/categories/${category.slug}`}
              >
                {category.name}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}