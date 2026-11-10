import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { consumeRateLimit, rateLimitIp } from "@/lib/rate-limit";

function headersFor(ip: string): Headers {
  return new Headers({ "x-forwarded-for": `${ip}, 10.0.0.1` });
}

beforeEach(() => {
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

describe("consumeRateLimit (in-memory fallback without Upstash env)", () => {
  it("allows requests under the checkout limit and blocks over it", async () => {
    const headers = headersFor("203.0.113.10");
    for (let attempt = 0; attempt < 5; attempt++) {
      const result = await consumeRateLimit("checkout", { requestHeaders: headers });
      expect(result.allowed).toBe(true);
      expect(result.backend).toBe("memory");
    }
    const blocked = await consumeRateLimit("checkout", { requestHeaders: headers });
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("keeps limits per IP and per policy", async () => {
    const first = headersFor("203.0.113.20");
    for (let attempt = 0; attempt < 5; attempt++) await consumeRateLimit("adminLogin", { requestHeaders: first });
    expect((await consumeRateLimit("adminLogin", { requestHeaders: first })).allowed).toBe(false);
    expect((await consumeRateLimit("adminLogin", { requestHeaders: headersFor("203.0.113.21") })).allowed).toBe(true);
    expect((await consumeRateLimit("search", { requestHeaders: first })).allowed).toBe(true);
  });

  it("limits admin logins per email even from a new IP", async () => {
    const email = "someone@example.com";
    for (let attempt = 0; attempt < 5; attempt++) {
      await consumeRateLimit("adminLogin", { requestHeaders: headersFor(`198.51.100.${attempt}`), email });
    }
    const blocked = await consumeRateLimit("adminLogin", { requestHeaders: headersFor("198.51.100.99"), email });
    expect(blocked.allowed).toBe(false);
    expect(blocked.backend).toBe("memory");
  });

  it("warns only once when the in-memory fallback kicks in", async () => {
    vi.resetModules();
    vi.mocked(console.warn).mockClear();
    const fresh = await import("@/lib/rate-limit");
    await fresh.consumeRateLimit("search", { requestHeaders: headersFor("203.0.113.70") });
    await fresh.consumeRateLimit("search", { requestHeaders: headersFor("203.0.113.71") });
    expect(console.warn).toHaveBeenCalledTimes(1);
  });

  it("peek does not consume a slot", async () => {
    const headers = headersFor("203.0.113.30");
    for (let attempt = 0; attempt < 3; attempt++) {
      expect((await consumeRateLimit("checkout", { requestHeaders: headers, peek: true })).allowed).toBe(true);
    }
    for (let attempt = 0; attempt < 5; attempt++) {
      expect((await consumeRateLimit("checkout", { requestHeaders: headers })).allowed).toBe(true);
    }
  });
});

describe("rateLimitIp", () => {
  it("uses only the first forwarded value and falls back to unknown", () => {
    expect(rateLimitIp(headersFor("203.0.113.40"))).toBe("203.0.113.40");
    expect(rateLimitIp(new Headers())).toBe("unknown");
  });
});
