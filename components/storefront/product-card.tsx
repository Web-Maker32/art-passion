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

  return (
    <article className="group relative z-30 h-full rounded-xl border border-silver bg-card shadow-card lift hover:border-brand-gold focus-within:border-brand-gold">
      <Link
        aria-label={`View ${product.title}`}
        className="flex h-full flex-col rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2"
        href={`/products/${product.slug}`}
      >
        <div className="bg-muted relative aspect-square overflow-hidden rounded-t-xl">
          <Image
            alt={imageSrc === "/placeholder.svg" ? "" : (image?.alt ?? product.title)}
            className="object-cover image-zoom"
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            src={imageSrc}
          />
          {secondImageSrc && secondImageSrc !== imageSrc && (
            <Image
              alt={secondImage.alt || product.title}
              aria-hidden="true"
              className="object-cover opacity-0 transition-opacity duration-interaction ease-interaction group-hover:opacity-100 group-focus-within:opacity-100"
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              src={secondImageSrc}
            />
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

function getImageSrc(url: string | undefined) {
  return url && !url.startsWith("https://placehold.co/")
    ? url
    : "/placeholder.svg";
}
