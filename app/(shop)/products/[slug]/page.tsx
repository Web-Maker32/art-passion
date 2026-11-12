import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Baby,
  Check,
  Layers,
  Package,
  Ruler,
  ShieldCheck,
  Truck,
  type LucideIcon,
} from "lucide-react";
import { cn } from "cn";
import { JsonLd } from "@/components/seo/JsonLd";
import { Breadcrumb } from "@/components/storefront/breadcrumb";
import { Container } from "@/components/storefront/container";
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

  const breadcrumbItems = [
    { name: "Home", path: "/" },
    { name: "Shop", path: "/products" },
    { name: product.category.name, path: `/categories/${product.category.slug}` },
    { name: product.title, path: `/products/${product.slug}` },
  ];

  return (
    <Container className="py-8 lg:py-12">
      <JsonLd data={buildProductJsonLd(product, { url: productUrl })} />
      <JsonLd data={buildBreadcrumbJsonLd(breadcrumbItems)} />
      <Breadcrumb items={breadcrumbItems} />

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        <ProductGallery images={product.images} title={product.title} />
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="gold">
              {productTypeLabels[product.type] ?? product.type}
            </Badge>
            <Badge
              render={<Link href={`/categories/${product.category.slug}`} />}
              variant="outline"
            >
              {product.category.name}
            </Badge>
          </div>
          <h1 className="font-heading text-foreground mt-4 text-h1 font-bold text-balance">
            {product.title}
          </h1>
          {product.variants[0] && (
            <p className="text-brand mt-3 text-xl font-semibold">
              From {formatPrice(product.variants[0].price)}
            </p>
          )}
          {product.shortDescription && (
            <p className="text-muted-foreground mt-4 text-lg leading-8">
              {product.shortDescription}
            </p>
          )}
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
        </div>
      </div>

      <section className="mt-14">
        <SectionHeading eyebrow="The details" title="About this piece" />
        <p className="text-muted-foreground max-w-3xl whitespace-pre-line leading-7">
          {product.description}
        </p>
        {product.tags.length > 0 && (
          <ul className="mt-5 flex flex-wrap gap-2">
            {product.tags.map((tag) => (
              <li
                className="rounded-full border border-silver bg-muted px-3 py-1.5 text-sm text-muted-foreground"
                key={tag}
              >
                {tag}
              </li>
            ))}
          </ul>
        )}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {product.whatsIncluded.length > 0 && (
            <DetailCard icon={Package} title="What's included">
              <ul className="space-y-1.5">
                {product.whatsIncluded.map((item) => (
                  <li className="flex gap-2" key={item}>
                    <Check
                      aria-hidden="true"
                      className="mt-0.5 size-4 shrink-0 text-brand"
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </DetailCard>
          )}
          {product.size && (
            <DetailCard icon={Ruler} title="Size">
              {product.size}
            </DetailCard>
          )}
          {product.recommendedAge && (
            <DetailCard icon={Baby} title="Recommended age">
              {product.recommendedAge}
            </DetailCard>
          )}
          {product.materials.length > 0 && (
            <DetailCard icon={Layers} title="Materials">
              <ul className="flex flex-wrap gap-2">
                {product.materials.map((material) => (
                  <li
                    className="rounded-full border border-silver bg-background px-3 py-1"
                    key={material}
                  >
                    {material}
                  </li>
                ))}
              </ul>
            </DetailCard>
          )}
          {product.safetyNote && (
            <DetailCard icon={ShieldCheck} title="Safety note">
              {product.safetyNote}
            </DetailCard>
          )}
          <DetailCard icon={Truck} title="Delivery">
            {deliveryInfoLine}.{" "}
            <Link
              className="text-foreground font-medium underline underline-offset-4"
              href="/shipping-and-returns"
            >
              Delivery details
            </Link>
          </DetailCard>
        </div>
      </section>

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
    </Container>
  );
}

function DetailCard({
  icon: Icon,
  title,
  children,
  className,
}: {
  icon: LucideIcon;
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-silver bg-card p-5 shadow-soft",
        className,
      )}
    >
      <div className="flex items-center gap-2.5">
        <span className="bg-gold/20 text-gold-text dark:text-gold-light inline-flex size-9 shrink-0 items-center justify-center rounded-xl">
          <Icon aria-hidden="true" className="size-4.5" />
        </span>
        <h3 className="font-heading text-card-foreground text-base font-semibold">
          {title}
        </h3>
      </div>
      <div className="text-muted-foreground mt-3 text-sm leading-relaxed">
        {children}
      </div>
    </div>
  );
}
