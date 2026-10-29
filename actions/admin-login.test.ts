import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { mocks } = vi.hoisted(() => ({
  mocks: {
    rateLimitCalls: 0,
    rateLimitLimited: false,
    verifyResult: null as { userId: string } | null,
    sessionSet: false,
    delayCalled: false,
  },
}));

vi.mock("@/lib/rate-limit", () => ({
  consumeRateLimit: vi.fn(async () => {
    mocks.rateLimitCalls += 1;
    return mocks.rateLimitLimited;
  }),
}));

vi.mock("@/lib/admin-auth", () => ({
  verifyAdminCredentials: vi.fn(async () => mocks.verifyResult),
  delay: vi.fn(async () => {
    mocks.delayCalled = true;
  }),
  adminLoginFailureDelayMs: 600,
}));

vi.mock("@/lib/admin-session", () => ({
  setAdminSessionCookie: vi.fn(async () => {
    mocks.sessionSet = true;
  }),
  destroyAdminSessionCookie: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));

import { adminLogin } from "@/actions/admin-login";

const validInput = { email: "admin@test.com", password: "password123" };

beforeEach(() => {
  mocks.rateLimitCalls = 0;
  mocks.rateLimitLimited = false;
  mocks.verifyResult = null;
  mocks.sessionSet = false;
  mocks.delayCalled = false;
});

describe("adminLogin", () => {
  it("returns generic error and does not set session on wrong password", async () => {
    mocks.verifyResult = null;

    const result = await adminLogin(validInput);

    expect(result).toEqual({
      success: false,
      message: "Invalid email or password.",
    });
    expect(mocks.sessionSet).toBe(false);
    expect(mocks.delayCalled).toBe(true);
  });

  it("sets session and redirects on correct credentials", async () => {
    mocks.verifyResult = { userId: "admin-1" };

    await expect(adminLogin(validInput)).rejects.toThrow("REDIRECT:/admin");
    expect(mocks.sessionSet).toBe(true);
  });

  it("rate limits after threshold and returns the rate-limit message", async () => {
    mocks.rateLimitLimited = true;

    const result = await adminLogin(validInput);

    expect(result).toEqual({
      success: false,
      message: "Too many sign-in attempts. Please wait and try again.",
    });
    expect(mocks.sessionSet).toBe(false);
  });

  it("returns field errors for invalid input (empty email)", async () => {
    const result = await adminLogin({ email: "", password: "pass" });

    expect(result).toMatchObject({ success: false });
    expect("fieldErrors" in (result as object)).toBe(true);
    expect(mocks.sessionSet).toBe(false);
  });

  it("returns field errors for missing password", async () => {
    const result = await adminLogin({ email: "a@b.com", password: "" });

    expect(result).toMatchObject({ success: false });
    expect(mocks.sessionSet).toBe(false);
  });
});
