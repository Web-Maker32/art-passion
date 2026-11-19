/**
 * Local assets (src starting with "/") and SVGs are served as-is and must
 * bypass the Cloudinary loader via next/image's `unoptimized` prop, so Next
 * neither builds useless srcset candidates nor tries to optimize vectors.
 * Cloudinary URLs keep going through lib/cloudinary-loader.ts.
 */
export function isUnoptimizedImageSrc(src: string): boolean {
  if (!src) return true;
  if (src.startsWith("/")) return true;
  const path = src.split(/[?#]/)[0] ?? src;
  return path.toLowerCase().endsWith(".svg");
}