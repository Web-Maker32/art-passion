"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { formatPrice } from "@/lib/format";
import type { ProductFilters } from "@/lib/product-filters";
import type { StoreCategory } from "@/lib/queries/categories";

const productTypes = [
  ["KIT", "Creative kits"],
  ["FELT_SET", "Felt sets"],
  ["GIFT_SET", "Gift sets"],
  ["HANDMADE", "Handmade"],
  ["SUPPLY", "Supplies"],
] as const;

const selectClass =
  "h-11 w-full rounded-lg border border-input bg-background px-3 text-foreground transition-colors duration-interaction ease-interaction focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

/** Number input with an inline "Rs" prefix, 44px tall, focus ring on the field. */
function PriceField({
  label,
  name,
  defaultValue,
  placeholder,
}: {
  label: string;
  name: "minPrice" | "maxPrice";
  defaultValue: number | string;
  placeholder: string;
}) {
  return (
    <label className="grid gap-1.5 text-sm font-medium">
      {label}
      <span className="border-input bg-background focus-within:outline-ring flex h-11 items-center rounded-lg border focus-within:outline-2 focus-within:outline-offset-2">
        <span aria-hidden="true" className="text-muted-foreground pl-3 text-sm">
          Rs
        </span>
        <input
          className="text-foreground h-full w-full min-w-0 bg-transparent px-2 outline-none"
          defaultValue={defaultValue}
          inputMode="numeric"
          min="0"
          name={name}
          placeholder={placeholder}
          type="number"
        />
      </span>
    </label>
  );
}

/** Switch-styled checkbox: keeps name="inStock" so the query string is unchanged. */
function InStockSwitch({ defaultChecked }: { defaultChecked: boolean }) {
  return (
    <label className="relative flex min-h-11 cursor-pointer items-center gap-3 text-sm font-medium whitespace-nowrap">
      <input
        className="peer sr-only"
        defaultChecked={defaultChecked}
        name="inStock"
        type="checkbox"
      />
      <span
        aria-hidden="true"
        className="bg-muted-foreground/30 peer-checked:bg-brand peer-focus-visible:outline-ring duration-interaction h-6 w-11 shrink-0 rounded-full transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2"
      />
      <span
        aria-hidden="true"
        className="bg-brand-foreground duration-interaction pointer-events-none absolute top-1/2 left-1 size-4 -translate-y-1/2 rounded-full shadow transition-transform peer-checked:translate-x-5"
      />
      In stock only
    </label>
  );
}

export function ProductFiltersPanel({
  categories,
  filters,
  lockedCategory,
  resultCount,
}: {
  categories: StoreCategory[];
  filters: ProductFilters;
  lockedCategory?: string;
  /** When provided, shown next to Sort on mobile and under the form on desktop. */
  resultCount?: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const nextParams = new URLSearchParams(searchParams.toString());

    for (const key of ["type", "minPrice", "maxPrice", "sort"]) {
      const value = String(formData.get(key) ?? "");
      if (value) nextParams.set(key, value);
      else nextParams.delete(key);
    }

    if (!lockedCategory) {
      const category = String(formData.get("category") ?? "");
      if (category) nextParams.set("category", category);
      else nextParams.delete("category");
    }

    if (formData.get("inStock") === "on") nextParams.set("inStock", "true");
    else nextParams.delete("inStock");

    nextParams.delete("page");
    const query = nextParams.toString();
    setOpen(false);
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  // Compact toolbar sort: applies on change, preserving every other param.
  function applySort(value: string) {
    const nextParams = new URLSearchParams(searchParams.toString());
    if (value) nextParams.set("sort", value);
    else nextParams.delete("sort");
    nextParams.delete("page");
    const query = nextParams.toString();
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  function removeFilter(key: string) {
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete(key);
    nextParams.delete("page");
    const query = nextParams.toString();
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  function clearAll() {
    const nextParams = new URLSearchParams(searchParams.toString());
    for (const key of ["category", "type", "minPrice", "maxPrice", "inStock"]) {
      nextParams.delete(key);
    }
    nextParams.delete("page");
    const query = nextParams.toString();
    setOpen(false);
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  const activeFilters: { key: string; label: string }[] = [];
  if (!lockedCategory && filters.category) {
    const match = categories.find((c) => c.slug === filters.category);
    activeFilters.push({
      key: "category",
      label: match?.name ?? filters.category,
    });
  }
  if (filters.type) {
    const match = productTypes.find(([value]) => value === filters.type);
    activeFilters.push({ key: "type", label: match?.[1] ?? filters.type });
  }
  if (filters.minPrice !== undefined) {
    activeFilters.push({
      key: "minPrice",
      label: `From ${formatPrice(filters.minPrice)}`,
    });
  }
  if (filters.maxPrice !== undefined) {
    activeFilters.push({
      key: "maxPrice",
      label: `Up to ${formatPrice(filters.maxPrice)}`,
    });
  }
  if (filters.inStock) {
    activeFilters.push({ key: "inStock", label: "In stock" });
  }
  const activeCount = activeFilters.length;

  const sortOptions = (
    <>
      <option value="newest">Newest</option>
      <option value="price-asc">Price: low to high</option>
      <option value="price-desc">Price: high to low</option>
    </>
  );

  const resultLabel =
    resultCount === undefined
      ? null
      : `${resultCount} ${resultCount === 1 ? "piece" : "pieces"} to explore`;

  return (
    <div>
      {/* Desktop (md+) filter form */}
      <form
        className="border-silver bg-card shadow-soft hidden gap-4 rounded-2xl border p-4 sm:p-5 md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"
        onSubmit={applyFilters}
      >
        {!lockedCategory && (
          <label className="grid gap-1.5 text-sm font-medium">
            Category
            <select
              className={selectClass}
              defaultValue={filters.category ?? ""}
              name="category"
            >
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.slug}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
        )}
        <label className="grid gap-1.5 text-sm font-medium">
          Product type
          <select
            className={selectClass}
            defaultValue={filters.type ?? ""}
            name="type"
          >
            <option value="">All types</option>
            {productTypes.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <PriceField
          defaultValue={filters.minPrice ?? ""}
          label="Min price"
          name="minPrice"
          placeholder="Min"
        />
        <PriceField
          defaultValue={filters.maxPrice ?? ""}
          label="Max price"
          name="maxPrice"
          placeholder="Max"
        />
        <label className="grid gap-1.5 text-sm font-medium">
          Sort by
          <select
            className={selectClass}
            defaultValue={filters.sort}
            name="sort"
          >
            {sortOptions}
          </select>
        </label>
        <div className="flex flex-col justify-end gap-3 md:col-span-2 lg:col-span-1">
          <InStockSwitch defaultChecked={filters.inStock} />
          <Button className="w-full" type="submit">
            Apply filters
          </Button>
        </div>
      </form>

      {/* Desktop result count */}
      {resultLabel && (
        <p
          aria-live="polite"
          className="text-muted-foreground my-5 hidden text-sm md:block"
        >
          {resultLabel}
        </p>
      )}

      {/* Mobile (below md) toolbar + drawer */}
      <Sheet onOpenChange={setOpen} open={open}>
        <div className="md:hidden">
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
            {resultLabel && (
              <p aria-live="polite" className="text-muted-foreground text-sm">
                {resultLabel}
              </p>
            )}
            <div className="ml-auto flex items-center gap-2">
              <select
                aria-label="Sort by"
                className="border-input bg-background text-foreground duration-interaction ease-interaction focus-visible:outline-ring h-11 max-w-[10rem] rounded-lg border px-2.5 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
                defaultValue={filters.sort}
                key={filters.sort}
                onChange={(event) => applySort(event.target.value)}
              >
                {sortOptions}
              </select>
              <SheetTrigger
                className="border-input bg-background text-foreground duration-interaction ease-interaction focus-visible:outline-ring inline-flex min-h-11 items-center gap-2 rounded-lg border px-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
                render={<button type="button" />}
              >
                <SlidersHorizontal aria-hidden="true" className="size-4" />
                Filters
                {activeCount > 0 && (
                  <span className="bg-brand text-brand-foreground inline-flex size-5 items-center justify-center rounded-full text-xs font-semibold">
                    {activeCount}
                  </span>
                )}
              </SheetTrigger>
            </div>
          </div>
          {activeCount > 0 && (
            <ul className="mt-3 flex flex-wrap gap-2">
              {activeFilters.map((filter) => (
                <li key={filter.key}>
                  <button
                    className="border-silver bg-card text-foreground duration-interaction ease-interaction hover-fine:hover:border-brand-gold focus-visible:outline-ring inline-flex min-h-11 items-center gap-2 rounded-full border px-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
                    onClick={() => removeFilter(filter.key)}
                    type="button"
                  >
                    {filter.label}
                    <X aria-hidden="true" className="size-4" />
                    <span className="sr-only">
                      Remove {filter.label} filter
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <SheetContent
          aria-label="Filters"
          className="bg-background flex w-full flex-col sm:max-w-md"
          side="right"
        >
          <SheetHeader className="border-border border-b pr-12">
            <SheetTitle className="font-brand-display text-xl">
              Filters
            </SheetTitle>
            <SheetDescription>
              Adjust price, type and availability.
            </SheetDescription>
          </SheetHeader>
          <form
            className="flex min-h-0 flex-1 flex-col"
            onSubmit={applyFilters}
          >
            <div className="scrollbar-brand min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-4">
              {!lockedCategory && (
                <label className="grid gap-1.5 text-sm font-medium">
                  Category
                  <select
                    className={selectClass}
                    defaultValue={filters.category ?? ""}
                    name="category"
                  >
                    <option value="">All categories</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.slug}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <label className="grid gap-1.5 text-sm font-medium">
                Product type
                <select
                  className={selectClass}
                  defaultValue={filters.type ?? ""}
                  name="type"
                >
                  <option value="">All types</option>
                  {productTypes.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <PriceField
                  defaultValue={filters.minPrice ?? ""}
                  label="Min price"
                  name="minPrice"
                  placeholder="Min"
                />
                <PriceField
                  defaultValue={filters.maxPrice ?? ""}
                  label="Max price"
                  name="maxPrice"
                  placeholder="Max"
                />
              </div>
              <InStockSwitch defaultChecked={filters.inStock} />
              {/* Preserve the toolbar sort when applying the drawer filters. */}
              <input defaultValue={filters.sort} name="sort" type="hidden" />
            </div>
            <SheetFooter className="border-border border-t">
              <Button className="w-full" type="submit">
                Apply filters
              </Button>
              <Button
                className="w-full"
                onClick={clearAll}
                type="button"
                variant="ghost"
              >
                Clear all
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
