import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";
import { CtaLink } from "@/components/content/cta";
import { Container } from "@/components/storefront/container";
import { ProductGrid } from "@/components/storefront/product-grid";
import { SectionHeading } from "@/components/storefront/section-heading";
import { Button } from "@/components/ui/button";
import { storeCategories } from "@/lib/catalog";
import { searchPublishedProducts } from "@/lib/queries/products";

const suggestedTerms = ["felt", "coloring kit", "painting kit", "gift set"];

const suggestionChip =
  "focus-visible:outline-ring inline-flex min-h-11 items-center rounded-full border border-silver bg-card px-4 text-sm font-medium transition-colors duration-interaction hover-fine:hover:border-brand-gold hover-fine:hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2";

export const metadata: Metadata = {
  title: "Search handmade products",
  description: "Search Art Passion's handmade gifts, felt sets, and creative kits.",
  // Search results are generated from a query string, so they are never indexed.
  robots: { index: false, follow: false },
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const params = await searchParams;
  const query = (Array.isArray(params.q) ? params.q[0] : params.q ?? "")
    .trim()
    .slice(0, 100);
  const products = query ? await searchPublishedProducts(query) : [];

  return (
    <Container className="py-10 lg:py-14">
      <SectionHeading
        description="Find a handmade piece, creative kit, or thoughtful gift."
        eyebrow="Search the shop"
        level={1}
        title="Search the collection"
      />
      <form action="/search" className="mb-8 flex max-w-2xl gap-2">
        <label className="sr-only" htmlFor="product-search">
          Search products
        </label>
        <div className="relative min-w-0 flex-1">
          <Search
            aria-hidden="true"
            className="text-muted-foreground pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2"
          />
          <input
            autoComplete="off"
            className="h-12 w-full rounded-xl border border-input bg-background pr-4 pl-11 text-foreground transition-colors duration-interaction ease-interaction"
            defaultValue={query}
            id="product-search"
            maxLength={100}
            name="q"
            placeholder="Try “felt animals” or “painting kit”"
            type="search"
          />
        </div>
        <Button className="shrink-0" size="lg" type="submit">
          Search
        </Button>
      </form>
      {query ? (
        <>
          <p className="mb-5 text-sm text-muted-foreground" aria-live="polite">
            {products.length} {products.length === 1 ? "result" : "results"} for{" "}
            <span className="font-semibold text-foreground">“{query}”</span>
          </p>
          {products.length > 0 ? (
            <ProductGrid
              emptyMessage="Try a different word, or browse all of our handmade pieces."
              emptyTitle="We could not find a match"
              products={products}
            />
          ) : (
            <div className="rounded-2xl border border-dashed border-silver-strong bg-muted/60 px-6 py-10">
              <h2 className="font-heading text-center text-xl font-semibold">
                No results for “{query}”
              </h2>
              <p className="text-muted-foreground mx-auto mt-2 max-w-lg text-center">
                Check the spelling or try a broader word. These usually help:
              </p>
              <ul className="mt-4 flex flex-wrap justify-center gap-2">
                {suggestedTerms.map((term) => (
                  <li key={term}>
                    <Link
                      className={suggestionChip}
                      href={`/search?q=${encodeURIComponent(term)}`}
                    >
                      {term}
                    </Link>
                  </li>
                ))}
              </ul>
              <p className="text-muted-foreground mt-6 text-center text-sm">
                Or browse a collection:
              </p>
              <ul className="mt-2 flex flex-wrap justify-center gap-2">
                {storeCategories.map((category) => (
                  <li key={category.slug}>
                    <Link
                      className={suggestionChip}
                      href={`/categories/${category.slug}`}
                    >
                      {category.name}
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="mt-7 flex flex-wrap justify-center gap-3">
                <CtaLink href="/products">Browse all products</CtaLink>
                <CtaLink href="/contact" variant="outline">
                  Ask us for help
                </CtaLink>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="rounded-2xl border border-dashed border-silver-strong bg-muted/60 px-6 py-12 text-center">
          <Search aria-hidden="true" className="text-gold-text mx-auto size-8" />
          <p className="text-muted-foreground mx-auto mt-3 max-w-md">
            Enter a title, material, or idea to search our collection.
          </p>
        </div>
      )}
    </Container>
  );
}
