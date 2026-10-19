import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/format";
import type { ProductCardData } from "@/lib/queries/products";

export function ProductCard({ product }: { product: ProductCardData }) {
  const image = product.images[0];
  const imageSrc =
    image && !image.url.startsWith("https://placehold.co/")
      ? image.url
      : "/placeholder.svg";
  const lowestPrice = product.variants[0]?.price;

  return (
    <article className="group border-silver bg-card relative z-30 h-full overflow-hidden rounded-xl border shadow-sm transition-shadow hover:shadow-md">
      <Link
        aria-label={`View ${product.title}`}
        className="focus-visible:outline-ring flex h-full flex-col focus-visible:outline-2 focus-visible:outline-offset-[-3px]"
        href={`/products/${product.slug}`}
      >
        <div className="bg-muted relative aspect-square overflow-hidden">
          <Image
            alt={
              imageSrc === "/placeholder.svg"
                ? ""
                : (image?.alt ?? product.title)
            }
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            src={imageSrc}
          />
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
