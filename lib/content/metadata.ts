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
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: `${title} | ${siteConfig.storeName}`,
      description,
      siteName: siteConfig.storeName,
      type: "website",
      url: path,
    },
  };
}
