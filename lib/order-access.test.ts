import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { cookieStore } = vi.hoisted(() => ({
  cookieStore: new Map<string, string>(),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    get: (name: string) => {
      const value = cookieStore.get(name);
      return value === undefined ? undefined : { name, value };
    },
    set: (name: string, value: string) => {
      cookieStore.set(name, value);
    },
    delete: (name: string) => {
      cookieStore.delete(name);
    },
  })),
}));

import { generateOrderAccessToken } from "@/lib/crypto";
import {
  createOrderAccessCookieValue,
  getOrderAccessCookieValue,
  parseOrderAccessCookieValue,
  selectOrderAccessToken,
  setOrderAccessCookie,
} from "@/lib/order-access";

const orderNumber = "AP-2026-0001";
const otherOrderNumber = "AP-2026-0002";

describe("order access cookie", () => {
  beforeEach(() => {
    cookieStore.clear();
  });

  it("round-trips a signed order access value", () => {
    const { rawToken } = generateOrderAccessToken();
    const value = createOrderAccessCookieValue(orderNumber, rawToken);

    expect(parseOrderAccessCookieValue(value)).toEqual({
      orderNumber,
      token: rawToken,
    });
  });

  it("rejects a tampered signature", () => {
    const { rawToken } = generateOrderAccessToken();
    const value = createOrderAccessCookieValue(orderNumber, rawToken);
    const replacement = value.endsWith("0") ? "1" : "0";
    const tampered = `${value.slice(0, -1)}${replacement}`;

    expect(parseOrderAccessCookieValue(tampered)).toBeNull();
  });

  it("stores each order under its own cookie name", async () => {
    const first = generateOrderAccessToken();
    const second = generateOrderAccessToken();

    await setOrderAccessCookie(orderNumber, first.rawToken);
    await setOrderAccessCookie(otherOrderNumber, second.rawToken);

    expect(cookieStore.has(`ap_order_${orderNumber}`)).toBe(true);
    expect(cookieStore.has(`ap_order_${otherOrderNumber}`)).toBe(true);
    expect(await getOrderAccessCookieValue(orderNumber)).toBe(
      createOrderAccessCookieValue(orderNumber, first.rawToken),
    );
    expect(await getOrderAccessCookieValue(otherOrderNumber)).toBe(
      createOrderAccessCookieValue(otherOrderNumber, second.rawToken),
    );
  });

  it("accepts a valid URL token without a cookie", () => {
    const { rawToken, tokenHash } = generateOrderAccessToken();

    expect(
      selectOrderAccessToken({
        orderNumber,
        storedHash: tokenHash,
        urlToken: rawToken,
        cookieValue: null,
      }),
    ).toBe(rawToken);
  });

  it("falls back to a valid cookie when the URL token is wrong", () => {
    const { rawToken, tokenHash } = generateOrderAccessToken();
    const other = generateOrderAccessToken();
    const cookieValue = createOrderAccessCookieValue(orderNumber, rawToken);

    expect(
      selectOrderAccessToken({
        orderNumber,
        storedHash: tokenHash,
        urlToken: other.rawToken,
        cookieValue,
      }),
    ).toBe(rawToken);
  });

  it("ignores a cookie issued for another order", () => {
    const { rawToken, tokenHash } = generateOrderAccessToken();
    const cookieValue = createOrderAccessCookieValue(
      otherOrderNumber,
      rawToken,
    );

    expect(
      selectOrderAccessToken({
        orderNumber,
        storedHash: tokenHash,
        urlToken: null,
        cookieValue,
      }),
    ).toBeNull();
  });

  it("returns null when neither candidate is valid", () => {
    const { tokenHash } = generateOrderAccessToken();

    expect(
      selectOrderAccessToken({
        orderNumber,
        storedHash: tokenHash,
        urlToken: "f".repeat(64),
        cookieValue: null,
      }),
    ).toBeNull();
  });
});
