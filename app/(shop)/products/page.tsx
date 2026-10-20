import type { Metadata } from "next";
import Link from "next/link";
import { ProductFiltersPanel } from "@/components/storefront/product-filters";
import { ProductGrid } from "@/components/storefront/product-grid";
import { SectionHeading } from "@/components/storefront/section-heading";
import {
  getPublishedCategories,
} from "@/lib/queries/categories";
import { getPublishedProducts } from "@/lib/queries/products";
import {
  parseProductFilters,
  type SearchParamsRecord,
} from "@/lib/product-filters";

export const metadata: Metadata = {
  title: "Shop handmade",
  description:
    "Browse handmade felt play sets, art kits, and thoughtful gifts from Art Passion.",
};

const PAGE_SIZE = 12;

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParamsRecord>;
}) {
  const filters = parseProductFilters(await searchParams);
  const [categories, products] = await Promise.all([
    getPublishedCategories(),
    getPublishedProducts({ filters }),
  ]);
  const totalPages = Math.max(1, Math.ceil(products.length / PAGE_SIZE));
  const currentPage = Math.min(filters.page, totalPages);
  const pagedProducts = products.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <SectionHeading
        description="Discover handmade play sets, creative kits, and gifts made with care."
        title="Shop the collection"
      />
      <ProductFiltersPanel categories={categories} filters={filters} />
      <p className="my-5 text-sm text-muted-foreground" aria-live="polite">
        {products.length} {products.length === 1 ? "piece" : "pieces"} to explore
      </p>
      <ProductGrid
        emptyMessage="Try adjusting your filters, or explore all of our handmade pieces."
        emptyTitle="No products match those filters"
        products={pagedProducts}
      />
      {totalPages > 1 && (
        <nav
          aria-label="Product pages"
          className="mt-8 flex items-center justify-center gap-4"
        >
          {currentPage > 1 && (
            <PageLink
              page={currentPage - 1}
              searchParams={await searchParams}
              text="Previous"
            />
          )}
          <span aria-current="page" className="text-sm font-medium">
            Page {currentPage} of {totalPages}
          </span>
          {currentPage < totalPages && (
            <PageLink
              page={currentPage + 1}
              searchParams={await searchParams}
              text="Next"
            />
          )}
        </nav>
      )}
      {categories.length > 0 && (
        <section aria-labelledby="category-links-heading" className="mt-12">
          <h2
            className="font-heading text-xl font-bold"
            id="category-links-heading"
          >
            Browse by category
          </h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {categories.map((category) => (
              <li key={category.id}>
                <Link
                  className="inline-flex min-h-10 items-center rounded-full border border-silver px-4 text-sm font-medium hover:border-brand hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  href={`/categories/${category.slug}`}
                >
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function PageLink({
  page,
  searchParams,
  text,
}: {
  page: number;
  searchParams: SearchParamsRecord;
  text: string;
}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (Array.isArray(value)) {
      for (const item of value) params.append(key, item);
    } else if (value) {
      params.set(key, value);
    }
  }
  params.set("page", String(page));

  return (
    <Link
      className="inline-flex min-h-11 items-center rounded-md border border-silver px-4 font-medium transition-colors duration-interaction hover-fine:hover:border-brand-gold hover-fine:hover:text-brand active:border-brand-gold active:bg-brand-gold/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      href={`/products?${params.toString()}`}
    >
      {text}
    </Link>
  );
}
