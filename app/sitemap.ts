import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";
import { buildSitemapEntries } from "@/lib/seo/sitemap-entries";

/**
 * Public pages only. Published products keep their real updatedAt; if the
 * database cannot be reached the static pages are still published, so a build
 * never fails just because Neon is unavailable.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    const [categories, products] = await Promise.all([
      prisma.category.findMany({
        where: { products: { some: { status: "PUBLISHED" } } },
        select: { slug: true },
      }),
      prisma.product.findMany({
        where: { status: "PUBLISHED" },
        select: { slug: true, updatedAt: true },
      }),
    ]);

    return buildSitemapEntries({ categories, products });
  } catch (error) {
    console.warn(
      "Sitemap: the catalogue could not be read, publishing static pages only.",
      error instanceof Error ? error.message : "unknown error",
    );

    return buildSitemapEntries({ categories: [], products: [] });
  }
}
