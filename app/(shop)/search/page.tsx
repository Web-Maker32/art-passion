import type { Metadata } from "next";
import { ProductGrid } from "@/components/storefront/product-grid";
import { SectionHeading } from "@/components/storefront/section-heading";
import { searchPublishedProducts } from "@/lib/queries/products";

export const metadata: Metadata = {
  title: "Search handmade products",
  description: "Search Art Passion's handmade gifts, felt sets, and creative kits.",
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
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <SectionHeading
        description="Find a handmade piece, creative kit, or thoughtful gift."
        title="Search the collection"
      />
      <form action="/search" className="mb-8 flex max-w-2xl gap-2">
        <label className="sr-only" htmlFor="product-search">
          Search products
        </label>
        <input
          autoComplete="off"
          className="min-h-12 min-w-0 flex-1 rounded-md border border-input bg-background px-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          defaultValue={query}
          id="product-search"
          maxLength={100}
          name="q"
          placeholder="Try “felt animals” or “painting kit”"
          type="search"
        />
        <button
          className="min-h-12 rounded-md bg-brand px-5 font-semibold text-brand-foreground hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          type="submit"
        >
          Search
        </button>
      </form>
      {query ? (
        <>
          <p className="mb-5 text-sm text-muted-foreground" aria-live="polite">
            {products.length} {products.length === 1 ? "result" : "results"} for
            {" "}
            <span className="font-semibold text-foreground">“{query}”</span>
          </p>
          <ProductGrid
            emptyMessage="Try a different word, or browse all of our handmade pieces."
            emptyTitle="We could not find a match"
            products={products}
          />
        </>
      ) : (
        <p className="rounded-xl bg-muted p-6 text-muted-foreground">
          Enter a title, material, or idea to search our collection.
        </p>
      )}
    </div>
  );
}
