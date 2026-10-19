import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/format";
import type { ProductCardData } from "@/lib/queries/products";

export function ProductCard({ product }: { product: ProductCardData }) {
  const image = product.images[0];
  const imageSrc = getImageSrc(image?.url);
  const secondImage = product.images[1];
  const secondImageSrc = secondImage ? getImageSrc(secondImage.url) : null;
  const lowestPrice = product.variants[0]?.price;
  const outOfStock = isProductOutOfStock(product);

  return (
    <article className="group relative z-30 h-full rounded-xl border border-silver bg-card shadow-card motion-safe:lift hover-fine:hover:border-brand-gold focus-within:border-brand-gold">
      <Link
        aria-label={`View ${product.title}`}
        className="flex h-full flex-col rounded-xl"
        href={`/products/${product.slug}`}
      >
        <div className="bg-muted relative aspect-square overflow-hidden rounded-t-xl">
          <Image
            alt={imageSrc === "/placeholder.svg" ? "" : (image?.alt ?? product.title)}
            className={`object-cover image-zoom ${
              outOfStock ? "opacity-90 grayscale-[20%]" : ""
            }`}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            src={imageSrc}
          />
          {secondImageSrc && secondImageSrc !== imageSrc && (
            <Image
              alt={secondImage.alt || product.title}
              aria-hidden="true"
              className={`object-cover opacity-0 transition-opacity duration-interaction ease-interaction motion-reduce:transition-none motion-safe:hover-fine:group-hover:opacity-100 ${
                outOfStock ? "grayscale-[20%]" : ""
              }`}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              src={secondImageSrc}
            />
          )}
          {outOfStock && (
            <span className="absolute top-2 left-2 rounded-full border border-border bg-background/95 px-2 py-1 text-xs font-semibold text-foreground shadow-card">
              Out of stock
            </span>
          )}
        </div>
        <div className="flex flex-1 flex-col space-y-2 p-4">
          <p className="text-gold-text text-xs font-semibold tracking-wide uppercase">
            {product.category.name}
          </p>
          <h3 className="font-heading text-card-foreground line-clamp-2 text-base font-semibold sm:text-lg">
            {product.title}
          </h3>
          {lowestPrice !== undefined && (
            <p className="text-brand mt-auto pt-2 font-semibold">
              From {formatPrice(lowestPrice)}
            </p>
          )}
        </div>
      </Link>
    </article>
  );
}

export function isProductOutOfStock(product: {
  madeToOrder: boolean;
  variants: ReadonlyArray<{ stock: number }>;
}): boolean {
  return (
    !product.madeToOrder &&
    product.variants.length > 0 &&
    product.variants.every((variant) => variant.stock === 0)
  );
}

function getImageSrc(url: string | undefined) {
  return url && !url.startsWith("https://placehold.co/")
    ? url
    : "/placeholder.svg";
}
