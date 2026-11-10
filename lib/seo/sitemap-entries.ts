import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo/site-url";

/**
 * Pure sitemap builder so it can be tested without a database. app/sitemap.ts
 * supplies the rows and falls back to the static entries if Neon is down.
 */

export type SitemapProduct = { slug: string; updatedAt: Date };
export type SitemapCategory = { slug: string };

type StaticEntry = {
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
};

/** Public pages only: no /admin, /cart, /checkout, /order or /search. */
const staticEntries: StaticEntry[] = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/products", changeFrequency: "weekly", priority: 0.9 },
  { path: "/about", changeFrequency: "monthly", priority: 0.6 },
  { path: "/contact", changeFrequency: "monthly", priority: 0.6 },
  { path: "/faq", changeFrequency: "monthly", priority: 0.6 },
  { path: "/shipping-and-returns", changeFrequency: "monthly", priority: 0.5 },
  { path: "/payment-info", changeFrequency: "monthly", priority: 0.5 },
  { path: "/privacy-policy", changeFrequency: "yearly", priority: 0.2 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.2 },
];

export function buildSitemapEntries({
  categories,
  products,
}: {
  categories: SitemapCategory[];
  products: SitemapProduct[];
}): MetadataRoute.Sitemap {
  return [
    ...staticEntries.map(({ path, changeFrequency, priority }) => ({
      url: absoluteUrl(path),
      changeFrequency,
      priority,
    })),
    ...categories.map((category) => ({
      url: absoluteUrl(`/categories/${encodeURIComponent(category.slug)}`),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...products.map((product) => ({
      url: absoluteUrl(`/products/${encodeURIComponent(product.slug)}`),
      lastModified: product.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
