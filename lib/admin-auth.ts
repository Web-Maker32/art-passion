import "server-only";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import {
  destroyAdminSessionCookie,
  readAdminSession,
} from "@/lib/admin-session";

export const adminLoginFailureDelayMs = 600;

// A throwaway hash so an unknown email still pays the bcrypt cost, keeping the
// response time indistinguishable from a known-email wrong-password attempt.
const dummyPasswordHash = bcrypt.hashSync("art-passion-timing-equalizer", 12);

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Verifies credentials against the admin user in the database.
 * Requires the ADMIN role and runs a bcrypt comparison even for unknown emails
 * so timing does not reveal which addresses exist. Returns the user id on success.
 */
export async function verifyAdminCredentials({
  email,
  password,
}: {
  email: string;
  password: string;
}): Promise<{ userId: string } | null> {
  const normalizedEmail = email.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true, passwordHash: true, role: true },
  });

  if (!user) {
    await bcrypt.compare(password, dummyPasswordHash);
    return null;
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches || user.role !== "ADMIN") {
    return null;
  }

  return { userId: user.id };
}

/**
 * Confirms the session cookie is valid AND that the user still exists with the
 * ADMIN role. Called on every protected page and server action.
 */
export async function resolveAdminUserId(): Promise<string | null> {
  const session = await readAdminSession();
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, role: true },
  });
  if (!user || user.role !== "ADMIN") return null;

  return user.id;
}

/**
 * Guard for server components and pages. Redirects to the login page when the
 * caller is not a live admin, clearing a stale cookie first.
 */
export async function requireAdmin(): Promise<string> {
  const userId = await resolveAdminUserId();
  if (userId) return userId;

  const session = await readAdminSession();
  if (session) {
    // A cookie was presented but is no longer valid (deleted/demoted user).
    await destroyAdminSessionCookie();
  }
  redirect("/admin/login");
}

export type AdminAssertion =
  | { authorized: true; userId: string }
  | { authorized: false };

/**
 * Guard for server actions. Never throws or redirects so the action can return a
 * structured unauthorized result to the client.
 */
export async function assertAdmin(): Promise<AdminAssertion> {
  const userId = await resolveAdminUserId();
  return userId ? { authorized: true, userId } : { authorized: false };
}
