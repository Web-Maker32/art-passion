import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check } from "lucide-react";
import { JsonLd } from "@/components/seo/JsonLd";
import { Badge } from "@/components/ui/badge";
import { ProductGallery } from "@/components/storefront/product-gallery";
import { ProductGrid } from "@/components/storefront/product-grid";
import { ProductPurchasePanel } from "@/components/storefront/product-purchase-panel";
import { SectionHeading } from "@/components/storefront/section-heading";
import { formatPrice } from "@/lib/format";
import { deliveryInfoLine, siteConfig } from "@/lib/site-config";
import {
  getProductBySlug,
  getPublishedProductSlugs,
  getRelatedProducts,
} from "@/lib/queries/products";
import { buildBreadcrumbJsonLd, buildProductJsonLd, trimDescription } from "@/lib/seo/json-ld";
import { absoluteUrl } from "@/lib/seo/site-url";

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
  if (!product) {
    // Unpublished or unknown products: the page renders the 404 and is not indexed.
    return { title: "Product not found", robots: { index: false, follow: false } };
  }

  const image = product.images[0];
  const description =
    product.shortDescription?.trim() || trimDescription(product.description);
  const path = `/products/${product.slug}`;

  return {
    title: product.title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: product.title,
      description,
      url: path,
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

  const relatedProducts = await getRelatedProducts({
    categorySlug: product.category.slug,
    productSlug: product.slug,
  });
  const productUrl = absoluteUrl(`/products/${product.slug}`);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <JsonLd data={buildProductJsonLd(product, { url: productUrl })} />
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Shop", path: "/products" },
          { name: product.category.name, path: `/categories/${product.category.slug}` },
          { name: product.title, path: `/products/${product.slug}` },
        ])}
      />
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
          {product.shortDescription && (
            <p className="mt-4 text-lg leading-8 text-muted-foreground">
              {product.shortDescription}
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
              whatsappNumber={siteConfig.whatsappNumber}
            />
          </div>
          {product.whatsIncluded.length > 0 && (
            <section className="mt-7">
              <h2 className="font-heading text-lg font-semibold">
                What&apos;s included
              </h2>
              <ul className="mt-2 space-y-1.5">
                {product.whatsIncluded.map((item) => (
                  <li className="flex gap-2 text-muted-foreground" key={item}>
                    <Check
                      aria-hidden="true"
                      className="mt-1 size-4 shrink-0 text-brand"
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {(product.size || product.recommendedAge) && (
            <dl className="mt-6 grid gap-3 sm:grid-cols-2">
              {product.size && (
                <div className="rounded-lg border border-silver bg-card p-3">
                  <dt className="text-xs font-semibold tracking-wide uppercase">
                    Size
                  </dt>
                  <dd className="mt-1 text-sm">{product.size}</dd>
                </div>
              )}
              {product.recommendedAge && (
                <div className="rounded-lg border border-silver bg-card p-3">
                  <dt className="text-xs font-semibold tracking-wide uppercase">
                    Recommended age
                  </dt>
                  <dd className="mt-1 text-sm">{product.recommendedAge}</dd>
                </div>
              )}
            </dl>
          )}
          {product.safetyNote && (
            <p className="mt-4 rounded-lg border border-gold/50 bg-muted px-4 py-3 text-sm text-muted-foreground">
              <strong className="font-semibold text-foreground">
                Safety note:{" "}
              </strong>
              {product.safetyNote}
            </p>
          )}
          <p className="mt-4 text-sm text-muted-foreground">
            {deliveryInfoLine}.{" "}
            <Link
              className="text-foreground underline underline-offset-4"
              href="/shipping-and-returns"
            >
              Delivery details
            </Link>
          </p>
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
            description={
              relatedProducts.every((item) => item.category.slug === product.category.slug)
                ? `A few more handmade finds from ${product.category.name}.`
                : "A few more handmade finds from our collection."
            }
            href={`/categories/${product.category.slug}`}
            title="You may also love"
          />
          <ProductGrid products={relatedProducts} />
        </section>
      )}
    </div>
  );
}
