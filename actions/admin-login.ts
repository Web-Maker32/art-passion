"use server";

import { redirect } from "next/navigation";
import { adminLoginSchema } from "@/lib/admin-order-status";
import {
  adminLoginFailureDelayMs,
  delay,
  verifyAdminCredentials,
} from "@/lib/admin-auth";
import {
  destroyAdminSessionCookie,
  setAdminSessionCookie,
} from "@/lib/admin-session";
import { consumeRateLimit } from "@/lib/rate-limit";

export type AdminLoginResult =
  | { success: true }
  | { success: false; message: string; fieldErrors?: Record<string, string> };

// A single generic message for every failure so we never reveal whether the
// email exists or the password was wrong.
const genericErrorMessage = "Invalid email or password.";
const rateLimitMessage = "Too many sign-in attempts. Please wait and try again.";

export async function adminLogin(input: unknown): Promise<AdminLoginResult> {
  let authorizedUserId: string | null = null;

  try {
    if (
      await consumeRateLimit({
        scope: "admin-login",
        limit: 5,
        windowMs: 15 * 60_000,
      })
    ) {
      return { success: false, message: rateLimitMessage };
    }

    const parsed = adminLoginSchema.safeParse(input);
    if (!parsed.success) {
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
      // Fixed delay on failure to blunt automated guessing.
      await delay(adminLoginFailureDelayMs);
      return { success: false, message: genericErrorMessage };
    }

    authorizedUserId = result.userId;
  } catch (error) {
    console.error("Admin sign-in failed.", error);
    return { success: false, message: genericErrorMessage };
  }

  if (!authorizedUserId) {
    return { success: false, message: genericErrorMessage };
  }

  await setAdminSessionCookie(authorizedUserId);
  redirect("/admin");
}

export async function adminLogout(): Promise<void> {
  await destroyAdminSessionCookie();
  redirect("/admin/login");
}
