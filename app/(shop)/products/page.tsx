import type { Metadata } from "next";
import Link from "next/link";
import { CategoryChips } from "@/components/storefront/category-chips";
import { Container } from "@/components/storefront/container";
import { ProductFiltersPanel } from "@/components/storefront/product-filters";
import { ProductGrid } from "@/components/storefront/product-grid";
import { SectionHeading } from "@/components/storefront/section-heading";
import { getPublishedCategories } from "@/lib/queries/categories";
import { getPublishedProducts } from "@/lib/queries/products";
import {
  parseProductFilters,
  type SearchParamsRecord,
} from "@/lib/product-filters";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<SearchParamsRecord>;
}): Promise<Metadata> {
  const hasFilters = Object.keys(await searchParams).length > 0;

  return {
    title: "Shop handmade",
    description:
      "Browse every handmade Art Passion piece: felt play sets, coloring kits, painting kits and gift sets, made by hand in Pakistan and posted to your door.",
    alternates: { canonical: "/products" },
    // Filtered and paginated views are thin duplicates of the clean listing.
    robots: hasFilters ? { index: false, follow: true } : undefined,
    openGraph: {
      title: "Shop handmade | Art Passion",
      description:
        "Browse every handmade Art Passion piece: felt play sets, coloring kits, painting kits and gift sets, made by hand in Pakistan and posted to your door.",
      url: "/products",
      type: "website",
    },
  };
}

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
    <Container className="py-10 lg:py-14">
      <SectionHeading
        description="Discover handmade play sets, creative kits, and gifts made with care."
        eyebrow="Handmade in Pakistan"
        level={1}
        title="Shop the collection"
      />
      <CategoryChips
        activeSlug={filters.category}
        categories={categories}
        className="mb-6"
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
          className="mt-10 flex items-center justify-center gap-3 sm:gap-4"
        >
          {currentPage > 1 && (
            <PageLink
              page={currentPage - 1}
              searchParams={await searchParams}
              text="Previous"
            />
          )}
          <span
            aria-current="page"
            className="text-sm font-medium text-muted-foreground"
          >
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
    </Container>
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
      className="inline-flex min-h-11 items-center rounded-lg border border-silver bg-card px-4 font-medium transition-colors duration-interaction hover-fine:hover:border-brand-gold hover-fine:hover:text-brand active:border-brand-gold active:bg-brand-gold/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      href={`/products?${params.toString()}`}
    >
      {text}
    </Link>
  );
}
