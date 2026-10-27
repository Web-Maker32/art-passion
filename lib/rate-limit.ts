import "server-only";

import { createHash } from "node:crypto";
import { cookies, headers } from "next/headers";

type RateLimitOptions = {
  scope: string;
  limit: number;
  windowMs?: number;
};

const defaultWindowMs = 60_000;
const rateLimits = new Map<string, { count: number; resetAt: number }>();

export async function consumeRateLimit({
  scope,
  limit,
  windowMs = defaultWindowMs,
}: RateLimitOptions): Promise<boolean> {
  const [cookieStore, requestHeaders] = await Promise.all([cookies(), headers()]);
  const now = Date.now();
  const ip =
    requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    requestHeaders.get("x-real-ip") ||
    "unknown";
  const cartCookie = cookieStore.get("ap_cart")?.value;
  const keys = [`${scope}:ip:${ip}`];

  if (cartCookie) {
    const cartHash = createHash("sha256").update(cartCookie).digest("hex");
    keys.push(`${scope}:cart:${cartHash}`);
  }

  let limited = false;
  for (const key of keys) {
    const current = rateLimits.get(key);
    if (!current || current.resetAt <= now) {
      rateLimits.set(key, { count: 1, resetAt: now + windowMs });
      continue;
    }
    current.count += 1;
    limited ||= current.count > limit;
  }

  if (rateLimits.size > 1_000) {
    for (const [key, entry] of rateLimits) {
      if (entry.resetAt <= now) rateLimits.delete(key);
    }
  }

  // Phase 8 will replace this per-process limiter with Upstash.
  return limited;
}
