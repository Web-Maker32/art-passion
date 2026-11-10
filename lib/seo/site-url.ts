import { env } from "@/lib/env";

/**
 * Single place where the public site URL is turned into absolute URLs.
 * NEXT_PUBLIC_SITE_URL comes from the Zod env schema, so a missing value
 * falls back to localhost instead of breaking a build.
 */

const FALLBACK_SITE_URL = "http://localhost:3000";

/** Removes trailing slashes so joining a path never produces "//". */
export function stripTrailingSlashes(value: string): string {
  return value.trim().replace(/\/+$/, "");
}

/**
 * Drops the query string and hash, guarantees a leading slash and no trailing
 * slash. "/" stays "/" so the home page keeps a stable canonical.
 */
export function canonicalPath(path: string): string {
  const [rawPath = ""] = path.split(/[?#]/);
  const withLeadingSlash = rawPath.startsWith("/") ? rawPath : `/${rawPath}`;
  const normalized = withLeadingSlash.replace(/\/{2,}/g, "/").replace(/\/+$/, "");
  return normalized === "" ? "/" : normalized;
}

export function buildAbsoluteUrl(siteUrl: string, path = "/"): string {
  const base = stripTrailingSlashes(siteUrl);
  const pathname = canonicalPath(path);
  return pathname === "/" ? base : `${base}${pathname}`;
}

/** The configured public site URL without a trailing slash. */
export function getSiteUrl(): string {
  return stripTrailingSlashes(env.NEXT_PUBLIC_SITE_URL) || FALLBACK_SITE_URL;
}

/** Absolute URL for a path on this site, without query strings or trailing slashes. */
export function absoluteUrl(path = "/"): string {
  return buildAbsoluteUrl(getSiteUrl(), path);
}
