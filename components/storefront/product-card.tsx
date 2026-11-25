import Image from "next/image";
import { isUnoptimizedImageSrc } from "@/lib/image-src";
import Link from "next/link";
import { formatPrice } from "@/lib/format";
import { isProductOutOfStock, LOW_STOCK_THRESHOLD } from "@/lib/availability";
import type { ProductCardData } from "@/lib/queries/products";
import { ScrollReveal } from "@/components/storefront/scroll-reveal";

export { isProductOutOfStock };

export function ProductCard({ product }: { product: ProductCardData }) {
  const image = product.images[0];
  const imageSrc = getImageSrc(image?.url);
  const secondImage = product.images[1];
  const secondImageSrc = secondImage ? getImageSrc(secondImage.url) : null;
  const lowestPrice = product.variants[0]?.price;
  const outOfStock = isProductOutOfStock(product);
  // One badge at most, on the image — the price row below stays unobstructed.
  const totalStock = product.variants.reduce(
    (sum, variant) => sum + variant.stock,
    0,
  );
  const badge = outOfStock
    ? {
        label: "Out of stock",
        className: "border-border bg-background/95 text-foreground",
      }
    : product.madeToOrder
      ? {
          label: "Made to order",
          className: "border-gold/60 bg-gold-light/95 text-brand-deep",
        }
      : totalStock > 0 && totalStock <= LOW_STOCK_THRESHOLD
        ? {
            label: "Low stock",
            className:
              "border-border bg-background/95 text-gold-text dark:text-gold-light",
          }
        : null;

  return (
    <ScrollReveal className="h-full">
      <article className="group border-silver bg-card shadow-card motion-safe:lift hover-fine:hover:border-brand-gold focus-within:border-brand-gold relative z-30 h-full rounded-2xl border">
        <Link
          aria-label={`View ${product.title}`}
          className="flex h-full flex-col rounded-2xl"
          href={`/products/${product.slug}`}
        >
          <div className="bg-muted relative aspect-square overflow-hidden rounded-t-2xl">
            <Image
              alt={
                imageSrc === "/placeholder.svg"
                  ? ""
                  : image?.alt || product.title
              }
              className={`image-zoom object-cover ${
                outOfStock ? "opacity-90 grayscale-[20%]" : ""
              }`}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              src={imageSrc}
              unoptimized={isUnoptimizedImageSrc(imageSrc)}
            />
            {secondImageSrc && secondImageSrc !== imageSrc && (
              <Image
                alt={secondImage.alt || product.title}
                aria-hidden="true"
                className={`duration-interaction ease-interaction motion-safe:hover-fine:group-hover:opacity-100 object-cover opacity-0 transition-opacity motion-reduce:transition-none ${
                  outOfStock ? "grayscale-[20%]" : ""
                }`}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                src={secondImageSrc}
                unoptimized={isUnoptimizedImageSrc(secondImageSrc)}
              />
            )}
            {badge && (
              <span
                className={`shadow-soft absolute top-3 left-3 rounded-full border px-2.5 py-1 text-xs font-semibold ${badge.className}`}
              >
                {badge.label}
              </span>
            )}
          </div>
          <div className="flex flex-1 flex-col p-4 sm:p-5">
            <p className="text-gold-text text-[11px] font-semibold tracking-[0.06em] uppercase">
              {product.category.name}
            </p>
            <h3
              className="font-heading text-card-foreground mt-1.5 line-clamp-2 text-base leading-snug font-semibold sm:text-lg"
              title={product.title}
            >
              {product.title}
            </h3>
            {lowestPrice !== undefined && (
              <p className="text-foreground dark:text-gold-light mt-auto pt-3 text-base font-semibold tabular-nums">
                <span className="text-muted-foreground text-xs font-medium">
                  From{" "}
                </span>
                {formatPrice(lowestPrice)}
              </p>
            )}
          </div>
        </Link>
      </article>
    </ScrollReveal>
  );
}

function getImageSrc(url: string | undefined) {
  return url && !url.startsWith("https://placehold.co/")
    ? url
    : "/placeholder.svg";
}
