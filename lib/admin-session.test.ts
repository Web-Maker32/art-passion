import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({ cookies: vi.fn() }));

import {
  createAdminSessionCookieValue,
  verifyAdminSessionCookie,
  adminSessionTtlMs,
} from "@/lib/admin-session";

describe("admin session cookie", () => {
  const userId = "user-123";

  it("round-trips a valid session", () => {
    const now = Date.now();
    const value = createAdminSessionCookieValue(userId, now);
    const session = verifyAdminSessionCookie(value, now + 1000);

    expect(session).not.toBeNull();
    expect(session?.userId).toBe(userId);
    expect(session?.expiresAt).toBe(now + adminSessionTtlMs);
  });

  it("rejects a tampered signature", () => {
    const value = createAdminSessionCookieValue(userId);
    const lastChar = value[value.length - 1];
    const replacement = lastChar === "0" ? "1" : "0";
    const tampered = `${value.slice(0, -1)}${replacement}`;

    expect(verifyAdminSessionCookie(tampered)).toBeNull();
  });

  it("rejects a tampered payload", () => {
    const value = createAdminSessionCookieValue(userId);
    const dotIndex = value.lastIndexOf(".");
    const payload = value.slice(0, dotIndex);
    const signature = value.slice(dotIndex + 1);
    // Replace payload with one for a different user but keep old signature
    const fakePayload = Buffer.from(
      JSON.stringify({ userId: "admin-999", expiresAt: Date.now() + adminSessionTtlMs }),
    ).toString("base64url");

    expect(verifyAdminSessionCookie(`${fakePayload}.${signature}`)).toBeNull();
    expect(payload.length).toBeGreaterThan(0);
  });

  it("rejects an expired session", () => {
    const past = Date.now() - adminSessionTtlMs - 1000;
    const value = createAdminSessionCookieValue(userId, past);

    expect(verifyAdminSessionCookie(value)).toBeNull();
  });

  it("rejects undefined or empty values", () => {
    expect(verifyAdminSessionCookie(undefined)).toBeNull();
    expect(verifyAdminSessionCookie("")).toBeNull();
    expect(verifyAdminSessionCookie("garbage")).toBeNull();
  });

  it("rejects a value without a dot separator", () => {
    expect(verifyAdminSessionCookie("nodothere")).toBeNull();
  });
});
