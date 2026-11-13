import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo/site-url";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Private or thin routes. They also carry meta robots noindex.
        disallow: ["/admin", "/api", "/cart", "/checkout", "/order", "/track-order", "/search"],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
