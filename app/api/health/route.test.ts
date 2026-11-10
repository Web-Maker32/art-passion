import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { mocks } = vi.hoisted(() => ({
  mocks: {
    queryRaw: vi.fn(),
    limit: { allowed: true, remaining: 10, resetAtMs: 0, retryAfterSeconds: 0, backend: "memory" as const },
  },
}));

vi.mock("@/lib/db", () => ({ prisma: { $queryRaw: mocks.queryRaw } }));
vi.mock("@/lib/rate-limit", () => ({ consumeRateLimit: vi.fn(async () => mocks.limit) }));

import { GET } from "@/app/api/health/route";

function request(path = "/api/health"): Request {
  return new Request(`https://shop.test${path}`, { headers: { "x-forwarded-for": "203.0.113.50" } });
}

beforeEach(() => {
  mocks.queryRaw.mockReset();
  mocks.queryRaw.mockResolvedValue([{ "?column?": 1 }]);
  mocks.limit.allowed = true;
});

describe("GET /api/health", () => {
  it("returns ok without leaking details", async () => {
    const response = await GET(request());
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(response.headers.get("X-Robots-Tag")).toContain("noindex");
  });

  it("returns a generic 503 when the database check fails", async () => {
    mocks.queryRaw.mockRejectedValue(new Error("connection string leaked here"));
    const response = await GET(request());
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ ok: false });
  });

  it("is rate limited with Retry-After", async () => {
    mocks.limit.allowed = false;
    mocks.limit.retryAfterSeconds = 30;
    const response = await GET(request());
    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("30");
  });

  it("rejects unexpected query parameters", async () => {
    const response = await GET(request("/api/health?debug=1"));
    expect(response.status).toBe(400);
  });
});
