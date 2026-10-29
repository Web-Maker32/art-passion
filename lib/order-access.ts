import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { verifyOrderAccessToken } from "@/lib/crypto";
import { env } from "@/lib/env";

const orderNumberPattern = /^AP-\d{4}-\d{4,}$/;
const tokenPattern = /^[a-f0-9]{64}$/i;
const signaturePattern = /^[a-f0-9]{64}$/i;
const cookieMaxAge = 60 * 60 * 24 * 30;

function getCookieName(orderNumber: string): string {
  return `ap_order_${orderNumber}`;
}

function signOrderAccess(orderNumber: string, token: string): string {
  return createHmac("sha256", env.ORDER_ACCESS_SECRET)
    .update(`order-access:${orderNumber}:${token}`)
    .digest("hex");
}

export function createOrderAccessCookieValue(
  orderNumber: string,
  token: string,
): string {
  return `${orderNumber}.${token}.${signOrderAccess(orderNumber, token)}`;
}

export type OrderAccessCookie = {
  orderNumber: string;
  token: string;
};

export function parseOrderAccessCookieValue(
  value: string | undefined,
): OrderAccessCookie | null {
  if (!value) return null;

  const parts = value.split(".");
  if (parts.length !== 3) return null;

  const [orderNumber, token, signature] = parts;
  if (
    !orderNumberPattern.test(orderNumber) ||
    !tokenPattern.test(token) ||
    !signaturePattern.test(signature)
  ) {
    return null;
  }

  const expected = Buffer.from(signOrderAccess(orderNumber, token), "hex");
  const actual = Buffer.from(signature, "hex");
  if (
    expected.length !== actual.length ||
    !timingSafeEqual(expected, actual)
  ) {
    return null;
  }

  return { orderNumber, token };
}

export function selectOrderAccessToken({
  orderNumber,
  storedHash,
  urlToken,
  cookieValue,
}: {
  orderNumber: string;
  storedHash: string | null;
  urlToken?: string | null;
  cookieValue?: string | null;
}): string | null {
  if (!storedHash) return null;

  const cookie = parseOrderAccessCookieValue(cookieValue ?? undefined);
  const cookieToken =
    cookie?.orderNumber === orderNumber ? cookie.token : null;

  for (const candidate of [urlToken ?? null, cookieToken]) {
    if (candidate && verifyOrderAccessToken(candidate, storedHash)) {
      return candidate;
    }
  }

  return null;
}

export async function setOrderAccessCookie(
  orderNumber: string,
  token: string,
): Promise<void> {
  if (!orderNumberPattern.test(orderNumber) || !tokenPattern.test(token)) {
    throw new Error("Cannot store an invalid order access token.");
  }

  const cookieStore = await cookies();
  cookieStore.set(
    getCookieName(orderNumber),
    createOrderAccessCookieValue(orderNumber, token),
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/order",
      maxAge: cookieMaxAge,
    },
  );
}

export async function getOrderAccessCookieValue(
  orderNumber: string,
): Promise<string | null> {
  if (!orderNumberPattern.test(orderNumber)) return null;

  const cookieStore = await cookies();
  return cookieStore.get(getCookieName(orderNumber))?.value ?? null;
}
