import Link from "next/link";
import { PackageOpen } from "lucide-react";
import { CtaLink } from "@/components/content/cta";
import { storeCategories } from "@/lib/catalog";

export default function ProductNotFound() {
  return (
    <div className="mx-auto w-full max-w-xl px-4 py-16 text-center sm:px-6 lg:py-24">
      <span className="bg-gold/20 text-gold-text dark:text-gold-light mx-auto inline-flex size-14 items-center justify-center rounded-2xl">
        <PackageOpen aria-hidden="true" className="size-6" />
      </span>
      <p className="text-gold-text mt-5 text-sm font-semibold tracking-wide uppercase">
        404
      </p>
      <h1 className="font-heading text-h1 mt-2 font-bold text-balance">
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
              className="text-brand dark:text-gold-light font-medium underline underline-offset-4"
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