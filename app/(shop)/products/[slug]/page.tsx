import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { ProductGallery } from "@/components/storefront/product-gallery";
import { ProductGrid } from "@/components/storefront/product-grid";
import { ProductPurchasePanel } from "@/components/storefront/product-purchase-panel";
import { SectionHeading } from "@/components/storefront/section-heading";
import { formatPrice } from "@/lib/format";
import {
  getProductBySlug,
  getPublishedProductSlugs,
  getPublishedProducts,
} from "@/lib/queries/products";

const productTypeLabels: Record<string, string> = {
  KIT: "Creative kit",
  FELT_SET: "Felt set",
  GIFT_SET: "Gift set",
  HANDMADE: "Handmade",
  SUPPLY: "Art supply",
};

export async function generateStaticParams() {
  return getPublishedProductSlugs();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product not found" };

  const image = product.images[0];
  return {
    title: product.title,
    description: product.description,
    openGraph: {
      title: product.title,
      description: product.description,
      type: "website",
      ...(image
        ? { images: [{ url: image.url, alt: image.alt || product.title }] }
        : {}),
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const relatedProducts = (await getPublishedProducts({
    categorySlug: product.category.slug,
  }))
    .filter((item) => item.slug !== product.slug)
    .slice(0, 4);
  const canonicalOrigin = process.env.SITE_URL || "http://localhost:3000";
  const productUrl = new URL(`/products/${product.slug}`, canonicalOrigin).toString();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <nav aria-label="Breadcrumb" className="mb-6 text-sm">
        <ol className="flex flex-wrap items-center gap-2 text-muted-foreground">
          <li>
            <Link
              className="underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              href="/products"
            >
              Shop
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link
              className="underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              href={`/categories/${product.category.slug}`}
            >
              {product.category.name}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="font-medium text-foreground">
            {product.title}
          </li>
        </ol>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        <ProductGallery images={product.images} title={product.title} />
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-blush text-white hover:bg-blush">
              {productTypeLabels[product.type] ?? product.type}
            </Badge>
            <Badge className="bg-orchid text-white hover:bg-orchid">
              {product.category.name}
            </Badge>
          </div>
          <h1 className="mt-4 font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {product.title}
          </h1>
          {product.variants[0] && (
            <p className="mt-3 text-xl font-semibold text-brand">
              From {formatPrice(product.variants[0].price)}
            </p>
          )}
          <p className="mt-5 whitespace-pre-line leading-7 text-muted-foreground">
            {product.description}
          </p>
          <div className="mt-6">
            <ProductPurchasePanel
              leadTimeDays={product.leadTimeDays}
              madeToOrder={product.madeToOrder}
              productTitle={product.title}
              productUrl={productUrl}
              variants={product.variants}
              whatsappNumber={process.env.WHATSAPP_NUMBER}
            />
          </div>
          {product.materials.length > 0 && (
            <section className="mt-7">
              <h2 className="font-heading text-lg font-semibold">Materials</h2>
              <ul className="mt-2 flex flex-wrap gap-2">
                {product.materials.map((material) => (
                  <li
                    className="rounded-full bg-muted px-3 py-1.5 text-sm"
                    key={material}
                  >
                    {material}
                  </li>
                ))}
              </ul>
            </section>
          )}
          {product.tags.length > 0 && (
            <section className="mt-5">
              <h2 className="font-heading text-lg font-semibold">Tags</h2>
              <ul className="mt-2 flex flex-wrap gap-2">
                {product.tags.map((tag, index) => (
                  <li
                    className={`rounded-full px-3 py-1.5 text-sm font-medium text-white ${
                      index % 2 === 0 ? "bg-blush" : "bg-orchid"
                    }`}
                    key={tag}
                  >
                    {tag}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>

      {relatedProducts.length > 0 && (
        <section className="mt-16 border-t border-silver pt-10">
          <SectionHeading
            description={`A few more handmade finds from ${product.category.name}.`}
            href={`/categories/${product.category.slug}`}
            title="You may also love"
          />
          <ProductGrid products={relatedProducts} />
        </section>
      )}
    </div>
  );
}
