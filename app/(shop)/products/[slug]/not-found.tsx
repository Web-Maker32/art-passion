import Link from "next/link";
import { CtaLink } from "@/components/content/cta";
import { storeCategories } from "@/lib/catalog";

export default function ProductNotFound() {
  return (
    <div className="mx-auto w-full max-w-xl px-4 py-16 text-center sm:px-6 lg:py-24">
      <p className="text-gold-text text-sm font-semibold tracking-wide uppercase">
        404
      </p>
      <h1 className="font-heading mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
        This piece is not available
      </h1>
      <p className="text-muted-foreground mt-4 leading-7">
        It may have been sold, unpublished, or the link may be out of date.
        Everything still available is in the shop.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <CtaLink href="/products">Browse the shop</CtaLink>
        <CtaLink href="/contact" variant="outline">
          Ask about a piece
        </CtaLink>
      </div>
      <p className="text-muted-foreground mt-8 text-sm">
        Looking for a collection?{" "}
        {storeCategories.map((category, index) => (
          <span key={category.slug}>
            {index > 0 ? " · " : null}
            <Link
              className="text-foreground underline underline-offset-4"
              href={`/categories/${category.slug}`}
            >
              {category.name}
            </Link>
          </span>
        ))}
      </p>
    </div>
  );
}
