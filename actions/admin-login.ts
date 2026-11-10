"use server";

import { redirect } from "next/navigation";
import { adminLoginSchema } from "@/lib/admin-order-status";
import {
  assertAdmin,
  adminLoginFailureDelayMs,
  delay,
  verifyAdminCredentials,
} from "@/lib/admin-auth";
import {
  destroyAdminSessionCookie,
  setAdminSessionCookie,
} from "@/lib/admin-session";
import { consumeRateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

export type AdminLoginResult =
  | { success: true }
  | { success: false; message: string; fieldErrors?: Record<string, string>; retryAfterSeconds?: number };

// A single generic message for every failure so we never reveal whether the
// email exists or the password was wrong.
const genericErrorMessage = "Invalid email or password.";
const rateLimitMessage = "Too many sign-in attempts. Please wait and try again.";

export async function adminLogin(input: unknown): Promise<AdminLoginResult> {
  let authorizedUserId: string | null = null;

  try {
    const parsed = adminLoginSchema.safeParse(input);
    const email = parsed.success ? parsed.data.email : undefined;
    const limit = await consumeRateLimit("adminLogin", { email, peek: true });
    if (!limit.allowed) {
      return { success: false, message: rateLimitMessage, retryAfterSeconds: limit.retryAfterSeconds };
    }
    if (!parsed.success) {
      await consumeRateLimit("adminLogin", { email });
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];
        if (typeof field === "string" && !fieldErrors[field]) {
          fieldErrors[field] = issue.message;
        }
      }
      return {
        success: false,
        message: "Check the highlighted fields and try again.",
        fieldErrors,
      };
    }

    const result = await verifyAdminCredentials(parsed.data);
    if (!result) {
      await consumeRateLimit("adminLogin", { email });
      // Fixed delay on failure to blunt automated guessing.
      await delay(adminLoginFailureDelayMs);
      return { success: false, message: genericErrorMessage };
    }

    authorizedUserId = result.userId;
  } catch {
    logger.error("admin_login_failed");
    return { success: false, message: genericErrorMessage };
  }

  if (!authorizedUserId) {
    return { success: false, message: genericErrorMessage };
  }

  await setAdminSessionCookie(authorizedUserId);
  redirect("/admin");
}

export async function adminLogout(): Promise<void> {
  const auth = await assertAdmin();
  if (auth.authorized) await destroyAdminSessionCookie();
  redirect("/admin/login");
}
