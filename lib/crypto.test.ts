import { describe, expect, it } from "vitest";
import {
  generateOrderAccessToken,
  verifyOrderAccessToken,
} from "@/lib/crypto";

describe("order access token", () => {
  it("accepts the matching token and refuses a wrong token", () => {
    const { rawToken, tokenHash } = generateOrderAccessToken();

    expect(verifyOrderAccessToken(rawToken, tokenHash)).toBe(true);
    expect(verifyOrderAccessToken("0".repeat(64), tokenHash)).toBe(false);
    expect(verifyOrderAccessToken("not-a-token", tokenHash)).toBe(false);
  });
});