/**
 * Custom Next.js image loader for Cloudinary. Referenced by next.config.ts via
 * images.loaderFile. It rewrites Cloudinary delivery URLs to request
 * f_auto,q_auto at a fixed set of width steps so Cloudinary (not Next) does the
 * optimization and the CDN caches a bounded number of variants.
 *
 * Local assets (starting with "/") and non-Cloudinary URLs are passed through
 * untouched, preserving the storefront's placeholder fallback behaviour. This
 * module must stay free of server-only imports and secrets because it runs in
 * the browser to build srcset candidates.
 */

// Fixed width steps keep the number of generated variants small and cacheable.
const WIDTH_STEPS = [256, 384, 512, 640, 750, 828, 1080, 1280, 1600, 2048];

function nearestWidthStep(width: number): number {
  for (const step of WIDTH_STEPS) {
    if (width <= step) return step;
  }
  return WIDTH_STEPS[WIDTH_STEPS.length - 1]!;
}

export default function cloudinaryLoader({
  src,
  width,
}: {
  src: string;
  width: number;
  quality?: string | number;
}): string {
  if (!src) return src;

  // Local files and non-Cloudinary hosts are returned unchanged.
  if (src.startsWith("/") || !src.includes("res.cloudinary.com")) {
    return src;
  }

  const w = nearestWidthStep(width);
  const transform = `f_auto,q_auto,w_${w}`;

  // Insert the transform right after the "/upload/" delivery segment.
  if (src.includes("/upload/")) {
    // Avoid stacking transforms if one is already present.
    if (src.includes("/upload/f_auto") || src.includes(`,w_`)) {
      return src;
    }
    return src.replace("/upload/", `/upload/${transform}/`);
  }

  return src;
}
