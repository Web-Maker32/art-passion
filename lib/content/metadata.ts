import type { Metadata } from "next";
import { siteConfig } from "@/lib/site-config";

/** Shared metadata shape for informational pages. */
export function contentMetadata({
  title,
  description,
}: {
  title: string;
  description: string;
}): Metadata {
  return {
    title,
    description,
    openGraph: {
      title: `${title} | ${siteConfig.storeName}`,
      description,
      siteName: siteConfig.storeName,
      type: "website",
    },
  };
}
