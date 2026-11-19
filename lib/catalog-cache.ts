import "server-only";

import { revalidatePath, revalidateTag, updateTag } from "next/cache";

/**
 * One shared tag for all cached storefront catalog data: product listing,
 * category pages, featured, search, product detail, related products and the
 * published-category queries. Any catalog mutation invalidates this tag so the
 * public store reflects admin changes immediately instead of waiting out the
 * `cacheLife("hours")` window.
 */
export const CATALOG_CACHE_TAG = "catalog";

/**
 * Invalidate catalog caches from a Server Action. `updateTag` (Next.js 16 Cache
 * Components) expires the tag so the next request — including the route
 * re-render that ships with the action response — waits for fresh data
 * (read-your-own-writes). The sitemap is refreshed too.
 */
export function invalidateCatalogCache(): void {
  updateTag(CATALOG_CACHE_TAG);
  revalidatePath("/sitemap.xml");
}

/**
 * Route-handler-safe invalidation (e.g. the image upload route, where
 * `updateTag` is not allowed). `{ expire: 0 }` never serves stale content, so
 * the next request blocks until fresh data is ready — the same immediate
 * behaviour as `updateTag`.
 */
export function revalidateCatalogCache(): void {
  revalidateTag(CATALOG_CACHE_TAG, { expire: 0 });
  revalidatePath("/sitemap.xml");
}
