import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/JsonLd";
import { ProductFiltersPanel } from "@/components/storefront/product-filters";
import { ProductGrid } from "@/components/storefront/product-grid";
import { categoryMetaDescriptions } from "@/lib/catalog";
import { getCategoryBySlug, getPublishedCategories, getPublishedCategorySlugs, categoryDescriptions } from "@/lib/queries/categories";
import { getPublishedProducts } from "@/lib/queries/products";
import { buildBreadcrumbJsonLd } from "@/lib/seo/json-ld";
import {
  parseProductFilters,
  type SearchParamsRecord,
} from "@/lib/product-filters";

export async function generateStaticParams() {
  return getPublishedCategorySlugs();
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<SearchParamsRecord>;
}): Promise<Metadata> {
  const [{ slug }, rawSearchParams] = await Promise.all([params, searchParams]);
  const category = await getCategoryBySlug(slug);
  if (!category) {
    return { title: "Category not found", robots: { index: false, follow: false } };
  }

  const products = await getPublishedProducts({ categorySlug: slug });
  const image = products[0]?.images[0]?.url;
  const description =
    categoryMetaDescriptions[slug] ??
    `Explore handmade pieces in ${category.name} at Art Passion, made by hand in Pakistan and posted anywhere in the country.`;
  const path = `/categories/${category.slug}`;

  return {
    title: category.name,
    description,
    alternates: { canonical: path },
    // Filtered views are thin duplicates of the clean category listing.
    robots:
      Object.keys(rawSearchParams).length > 0
        ? { index: false, follow: true }
        : undefined,
    openGraph: {
      title: `${category.name} | Art Passion`,
      description,
      url: path,
      type: "website",
      ...(image ? { images: [{ url: image, alt: category.name }] } : {}),
    },
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<SearchParamsRecord>;
}) {
  const [{ slug }, rawSearchParams] = await Promise.all([params, searchParams]);
  const [category, categories] = await Promise.all([
    getCategoryBySlug(slug),
    getPublishedCategories(),
  ]);

  if (!category) notFound();

  const filters = parseProductFilters(rawSearchParams);
  const [products] = await Promise.all([
    getPublishedProducts({ categorySlug: slug, filters }),
  ]);
  const description =
    categoryDescriptions[slug] ??
    `Explore handmade pieces in ${category.name} at Art Passion.`;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Shop", path: "/products" },
          { name: category.name, path: `/categories/${category.slug}` },
        ])}
      />
      <p className="text-sm font-semibold tracking-wide text-gold-text uppercase">
        Handmade collection
      </p>
      <h1 className="mt-2 font-heading text-3xl font-bold tracking-tight sm:text-4xl">
        {category.name}
      </h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">{description}</p>
      <div className="mt-7">
        <ProductFiltersPanel
          categories={categories}
          filters={filters}
          lockedCategory={slug}
        />
      </div>
      <div className="mt-8">
        <ProductGrid
          emptyMessage="This collection is still being prepared. Browse the full shop to see everything that is available now."
          emptyTitle="More handmade pieces coming soon"
          products={products}
        />
      </div>
    </div>
  );
}
