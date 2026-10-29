import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { env } from "@/lib/env";

export const adminSessionCookieName = "ap_admin_session";
export const adminSessionTtlMs = 1000 * 60 * 60 * 24 * 7;
const adminSessionMaxAgeSeconds = adminSessionTtlMs / 1000;

const signaturePattern = /^[a-f0-9]{64}$/i;

export type AdminSession = {
  userId: string;
  expiresAt: number;
};

function sign(payload: string): string {
  return createHmac("sha256", env.ADMIN_SESSION_SECRET)
    .update(`admin-session:${payload}`)
    .digest("hex");
}

function encodePayload(session: AdminSession): string {
  return Buffer.from(JSON.stringify(session), "utf8").toString("base64url");
}

function decodePayload(payload: string): AdminSession | null {
  try {
    const parsed = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as unknown;
    if (
      !parsed ||
      typeof parsed !== "object" ||
      typeof (parsed as AdminSession).userId !== "string" ||
      typeof (parsed as AdminSession).expiresAt !== "number"
    ) {
      return null;
    }
    const { userId, expiresAt } = parsed as AdminSession;
    if (!userId || !Number.isFinite(expiresAt)) return null;
    return { userId, expiresAt };
  } catch {
    return null;
  }
}

/**
 * Builds a signed session value: `<base64url payload>.<hmac signature>`.
 * The signature covers the payload only; the expiry lives inside the payload so
 * it cannot be extended without invalidating the signature.
 */
export function createAdminSessionCookieValue(
  userId: string,
  now: number = Date.now(),
): string {
  const payload = encodePayload({ userId, expiresAt: now + adminSessionTtlMs });
  return `${payload}.${sign(payload)}`;
}

/**
 * Verifies the signature with a constant-time comparison and rejects expired or
 * malformed sessions. Returns null for anything that is not a valid, live session.
 */
export function verifyAdminSessionCookie(
  value: string | undefined,
  now: number = Date.now(),
): AdminSession | null {
  if (!value) return null;

  const separator = value.lastIndexOf(".");
  if (separator <= 0) return null;

  const payload = value.slice(0, separator);
  const signature = value.slice(separator + 1);
  if (!signaturePattern.test(signature)) return null;

  const expected = Buffer.from(sign(payload), "hex");
  const actual = Buffer.from(signature, "hex");
  if (
    expected.length !== actual.length ||
    !timingSafeEqual(expected, actual)
  ) {
    return null;
  }

  const session = decodePayload(payload);
  if (!session || session.expiresAt <= now) return null;

  return session;
}

export async function readAdminSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies();
  const value = cookieStore.get(adminSessionCookieName)?.value;
  // Read the cookie (a dynamic API) before Date.now() is evaluated so
  // cacheComponents sees the timestamp inside the request-time scope.
  return verifyAdminSessionCookie(value, Date.now());
}

export async function setAdminSessionCookie(userId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(
    adminSessionCookieName,
    createAdminSessionCookieValue(userId),
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/admin",
      maxAge: adminSessionMaxAgeSeconds,
    },
  );
}

export async function destroyAdminSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(adminSessionCookieName);
}
