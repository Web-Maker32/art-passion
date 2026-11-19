import type { Metadata } from "next";
import { siteConfig } from "@/lib/site-config";

/**
 * Shared metadata for informational pages. `path` is required so every page
 * publishes its own canonical URL and cannot inherit the home page one.
 */
export function contentMetadata({
  title,
  description,
  path,
}: {
  title: string;
  description: string;
  path: string;
}): Metadata {
  const ogTitle = `${title} | ${siteConfig.storeName}`;
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: ogTitle,
      description,
      siteName: siteConfig.storeName,
      type: "website",
      url: path,
      images: [
        {
          url: "/og-image.png",
          width: 1200,
          height: 630,
          alt: "Art Passion - the passion of art",
        },
      ],
    },
    // Page-level openGraph replaces the layout's, so each page must carry its
    // own share image and twitter card instead of inheriting the home one.
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description,
      images: {
        url: "/og-image.png",
        alt: "Art Passion - the passion of art",
      },
    },
  };
}
