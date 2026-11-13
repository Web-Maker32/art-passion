// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("@/lib/track-order", () => ({ findTrackedOrder: vi.fn() }));
vi.mock("@/lib/rate-limit", () => ({ consumeTrackOrderRateLimit: vi.fn() }));
vi.mock("@/lib/logger", () => ({ logger: { warn: vi.fn() } }));
import { findTrackedOrder } from "@/lib/track-order";
import { consumeTrackOrderRateLimit } from "@/lib/rate-limit";
import { TRACK_ORDER_NOT_FOUND } from "@/lib/track-order-schema";
import { POST } from "./route";
import config from "@/next.config";
import robots from "@/app/robots";

const request = (input: unknown) =>
  new Request("https://shop.test/api/track-order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
const details = { orderNumber: "AP-2026-0001", phone: "03001234567" };
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(consumeTrackOrderRateLimit).mockResolvedValue({
    allowed: true,
    remaining: 4,
    resetAtMs: 0,
    retryAfterSeconds: 0,
    backend: "memory",
  });
});

describe("read-only tracking POST", () => {
  it("gives identical responses for unknown order and wrong phone", async () => {
    vi.mocked(findTrackedOrder).mockResolvedValue(null);
    const unknown = await POST(
      request({ ...details, orderNumber: "AP-2026-9999" }),
    );
    const wrong = await POST(request({ ...details, phone: "03009999999" }));
    expect(unknown.status).toBe(wrong.status);
    expect(await unknown.json()).toEqual({
      ok: false,
      message: TRACK_ORDER_NOT_FOUND,
    });
    expect(await wrong.json()).toEqual({
      ok: false,
      message: TRACK_ORDER_NOT_FOUND,
    });
    expect(wrong.headers.get("Cache-Control")).toContain("no-store");
    expect(wrong.headers.get("Referrer-Policy")).toBe("no-referrer");
    expect(wrong.headers.get("X-Robots-Tag")).toBe("noindex, nofollow");
  });
  it("returns a friendly 429 with Retry-After before querying", async () => {
    vi.mocked(consumeTrackOrderRateLimit).mockResolvedValue({
      allowed: false,
      remaining: 0,
      resetAtMs: 0,
      retryAfterSeconds: 900,
      backend: "memory",
    });
    const response = await POST(request(details));
    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("900");
    expect(findTrackedOrder).not.toHaveBeenCalled();
  });
  it("bounds malformed/oversized input and still applies the IP limiter", async () => {
    const response = await POST(
      request({ ...details, phone: "x".repeat(3000) }),
    );
    expect(response.status).toBe(400);
    expect(consumeTrackOrderRateLimit).toHaveBeenCalled();
    expect(findTrackedOrder).not.toHaveBeenCalled();
  });
  it("does not allow query-string lookup or a foreign Origin", async () => {
    for (const req of [
      new Request(
        "https://shop.test/api/track-order?orderNumber=AP-2026-0001",
        { method: "POST", body: JSON.stringify(details) },
      ),
      new Request("https://shop.test/api/track-order", {
        method: "POST",
        headers: { Origin: "https://other.test" },
        body: JSON.stringify(details),
      }),
    ])
      expect((await POST(req)).status).toBe(400);
    expect(findTrackedOrder).not.toHaveBeenCalled();
  });
  it("sets page and endpoint privacy headers and disallows crawling", async () => {
    const headers = await config.headers!();
    for (const source of ["/track-order/:path*", "/api/track-order/:path*"]) {
      const values = headers.find((rule) => rule.source === source)?.headers;
      expect(values).toEqual(
        expect.arrayContaining([
          { key: "Cache-Control", value: "private, no-store, max-age=0" },
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
          { key: "Referrer-Policy", value: "no-referrer" },
        ]),
      );
    }
    expect(robots().rules).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          disallow: expect.arrayContaining(["/track-order"]),
        }),
      ]),
    );
  });
});
