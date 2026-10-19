import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductFiltersPanel } from "@/components/storefront/product-filters";
import { ProductGrid } from "@/components/storefront/product-grid";
import { getCategoryBySlug, getPublishedCategories, getPublishedCategorySlugs, categoryDescriptions } from "@/lib/queries/categories";
import { getPublishedProducts } from "@/lib/queries/products";
import {
  parseProductFilters,
  type SearchParamsRecord,
} from "@/lib/product-filters";

export async function generateStaticParams() {
  return getPublishedCategorySlugs();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return { title: "Category not found" };

  const products = await getPublishedProducts({ categorySlug: slug });
  const image = products[0]?.images[0]?.url;
  const description =
    categoryDescriptions[slug] ??
    `Explore handmade pieces in ${category.name} at Art Passion.`;

  return {
    title: category.name,
    description,
    openGraph: {
      title: `${category.name} | Art Passion`,
      description,
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
          emptyMessage="There are no published products in this category yet."
          emptyTitle="More handmade pieces coming soon"
          products={products}
        />
      </div>
    </div>
  );
}
