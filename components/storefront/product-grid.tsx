import Link from "next/link";
import { PackageOpen } from "lucide-react";
import { cn } from "cn";
import type { ProductCardData } from "@/lib/queries/products";
import { ProductCard } from "@/components/storefront/product-card";

export function ProductGrid({
  products,
  heading,
  emptyTitle = "Nothing to show just yet",
  emptyMessage = "Please check back soon for new handmade finds.",
  listClassName,
}: {
  products: ProductCardData[];
  /** Optional screen-reader h2 so listing pages keep a tidy h1 → h2 → h3 outline. */
  heading?: string;
  emptyTitle?: string;
  emptyMessage?: string;
  /** Extra classes for the list (e.g. bottom padding to clear the WhatsApp float). */
  listClassName?: string;
}) {
  if (!products.length) {
    return (
      <div className="border-silver-strong bg-muted/60 rounded-2xl border border-dashed px-6 py-12 text-center">
        <PackageOpen
          aria-hidden="true"
          className="text-gold-text mx-auto size-9"
        />
        <h2 className="font-heading mt-4 text-xl font-semibold">
          {emptyTitle}
        </h2>
        <p className="text-muted-foreground mx-auto mt-2 max-w-md">
          {emptyMessage}
        </p>
        <Link
          className="bg-brand text-brand-foreground lift-sm press hover:bg-brand-hover focus-visible:outline-ring mt-5 inline-flex min-h-11 items-center rounded-lg px-5 font-semibold focus-visible:outline-2 focus-visible:outline-offset-2"
          href="/products"
        >
          Explore the shop
        </Link>
      </div>
    );
  }

  return (
    <>
      {heading && <h2 className="sr-only">{heading}</h2>}
      <ul className={cn("grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4", listClassName)}>
        {products.map((product) => (
          <li key={product.id}>
            <ProductCard product={product} />
          </li>
        ))}
      </ul>
    </>
  );
}
