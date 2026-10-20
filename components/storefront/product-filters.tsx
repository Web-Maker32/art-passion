"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { FormEvent } from "react";
import { Button } from "@/components/ui/button";
import type { ProductFilters } from "@/lib/product-filters";
import type { StoreCategory } from "@/lib/queries/categories";

const productTypes = [
  ["KIT", "Creative kits"],
  ["FELT_SET", "Felt sets"],
  ["GIFT_SET", "Gift sets"],
  ["HANDMADE", "Handmade"],
  ["SUPPLY", "Supplies"],
] as const;

export function ProductFiltersPanel({
  categories,
  filters,
  lockedCategory,
}: {
  categories: StoreCategory[];
  filters: ProductFilters;
  lockedCategory?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

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
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  return (
    <form
      className="grid gap-4 rounded-xl border border-silver bg-card p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"
      onSubmit={applyFilters}
    >
      {!lockedCategory && (
        <label className="grid gap-1.5 text-sm font-medium">
          Category
          <select
            className="h-10 rounded-md border border-input bg-background px-3 text-foreground transition-colors duration-interaction ease-interaction"
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
          className="h-10 rounded-md border border-input bg-background px-3 text-foreground transition-colors duration-interaction ease-interaction"
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
      <label className="grid gap-1.5 text-sm font-medium">
        Min price (PKR)
        <input
          className="h-10 rounded-md border border-input bg-background px-3 text-foreground transition-colors duration-interaction ease-interaction"
          defaultValue={filters.minPrice ?? ""}
          min="0"
          name="minPrice"
          type="number"
        />
      </label>
      <label className="grid gap-1.5 text-sm font-medium">
        Max price (PKR)
        <input
          className="h-10 rounded-md border border-input bg-background px-3 text-foreground transition-colors duration-interaction ease-interaction"
          defaultValue={filters.maxPrice ?? ""}
          min="0"
          name="maxPrice"
          type="number"
        />
      </label>
      <label className="grid gap-1.5 text-sm font-medium">
        Sort by
        <select
          className="h-10 rounded-md border border-input bg-background px-3 text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          defaultValue={filters.sort}
          name="sort"
        >
          <option value="newest">Newest</option>
          <option value="price-asc">Price: low to high</option>
          <option value="price-desc">Price: high to low</option>
        </select>
      </label>
      <div className="flex items-center gap-4 sm:col-span-2 lg:col-span-1 xl:flex-col xl:items-stretch xl:justify-end">
        <label className="flex min-h-10 items-center gap-2 text-sm font-medium">
          <input
            className="size-4 accent-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            defaultChecked={filters.inStock}
            name="inStock"
            type="checkbox"
          />
          In stock only
        </label>
        <Button className="min-h-10" type="submit">
          Apply filters
        </Button>
      </div>
    </form>
  );
}
