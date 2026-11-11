import "server-only";

import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";

export const rateLimitPolicies = {
  checkout: { limit: 5, windowMs: 600_000 },
  adminLogin: { limit: 5, windowMs: 900_000 },
  search: { limit: 30, windowMs: 60_000 },
  order: { limit: 20, windowMs: 60_000 },
  cart: { limit: 60, windowMs: 60_000 },
  health: { limit: 30, windowMs: 60_000 },
  paymentProof: { limit: 5, windowMs: 600_000 },
} as const;
export type RateLimitPolicy = keyof typeof rateLimitPolicies;
export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAtMs: number;
  retryAfterSeconds: number;
  backend: "memory" | "upstash";
};

const counters = new Map<string, { count: number; resetAt: number }>();
const remote = new Map<RateLimitPolicy, Ratelimit>();
let warned = false;

export function rateLimitIp(requestHeaders: Headers): string {
  return requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim().slice(0, 128) || "unknown";
}

function fallbackWarning() {
  if (!warned) {
    warned = true;
    logger.warn("rate_limit_fallback");
  }
}

function result(remaining: number, reset: number, backend: RateLimitResult["backend"], allowed = remaining > 0): RateLimitResult {
  return { allowed, remaining: Math.max(0, remaining), resetAtMs: reset,
    retryAfterSeconds: allowed ? 0 : Math.max(1, Math.ceil((reset - Date.now()) / 1000)), backend };
}

function memoryLimit(policy: RateLimitPolicy, key: string, peek: boolean): RateLimitResult {
  const { limit, windowMs } = rateLimitPolicies[policy];
  const now = Date.now();
  let entry = counters.get(key);
  if (entry && entry.resetAt <= now) { counters.delete(key); entry = undefined; }
  if (!entry) {
    if (peek) return result(limit, now + windowMs, "memory");
    if (counters.size >= 10_000) {
      for (const [id, value] of counters) if (value.resetAt <= now) counters.delete(id);
      // Preserve active limits under identifier flooding, without unbounded memory.
      if (counters.size >= 10_000) return result(0, now + windowMs, "memory", false);
    }
    entry = { count: 0, resetAt: now + windowMs };
    counters.set(key, entry);
  }
  const allowed = entry.count < limit;
  if (!peek && allowed) entry.count++;
  return result(limit - entry.count, entry.resetAt, "memory", allowed);
}

async function checkKey(policy: RateLimitPolicy, key: string, peek: boolean): Promise<RateLimitResult> {
  const url = env.UPSTASH_REDIS_REST_URL;
  const token = env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) {
    try {
      let limiter = remote.get(policy);
      if (!limiter) {
        const { limit, windowMs } = rateLimitPolicies[policy];
        limiter = new Ratelimit({ redis: new Redis({ url, token }),
          limiter: Ratelimit.fixedWindow(limit, `${windowMs} ms`),
          prefix: `art-passion:rate:${policy}`, analytics: false, timeout: 1500, ephemeralCache: false });
        remote.set(policy, limiter);
      }
      if (peek) {
        const remaining = await limiter.getRemaining(key);
        return result(remaining.remaining, remaining.reset, "upstash");
      }
      const limited = await limiter.limit(key);
      await limited.pending;
      if (limited.reason === "timeout") throw new Error("Limiter unavailable");
      return result(limited.remaining, limited.reset, "upstash", limited.success);
    } catch {
      fallbackWarning();
    }
  } else fallbackWarning();
  return memoryLimit(policy, key, peek);
}

export async function consumeRateLimit(
  policy: RateLimitPolicy,
  options: { requestHeaders?: Headers; email?: string; peek?: boolean } = {},
): Promise<RateLimitResult> {
  const requestHeaders = options.requestHeaders ?? await headers();
  const identities = [`ip:${rateLimitIp(requestHeaders)}`];
  if (policy === "adminLogin" && options.email) identities.push(`email:${options.email.trim().toLowerCase()}`);
  const results = await Promise.all(identities.map((identity) => {
    const key = `${policy}:${createHash("sha256").update(identity).digest("hex")}`;
    return checkKey(policy, key, options.peek ?? false);
  }));
  const blocked = results.filter((entry) => !entry.allowed);
  return (blocked.length ? blocked : results).reduce((a, b) =>
    blocked.length ? (a.retryAfterSeconds >= b.retryAfterSeconds ? a : b) : (a.remaining <= b.remaining ? a : b));
}
