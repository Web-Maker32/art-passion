import { env } from "@/lib/env";
import { logger } from "@/lib/logger";

export type OwnerEmailConfig = {
  apiKey: string;
  to: string;
  from: string;
};

let missingConfigWarned = false;

/**
 * Every owner email setting is optional. When one is missing the shop keeps
 * working normally: the notification is skipped and a single warning is logged.
 */
export function getOwnerEmailConfig(): OwnerEmailConfig | null {
  const apiKey = env.RESEND_API_KEY?.trim();
  const to = env.ORDER_NOTIFY_EMAIL?.trim();
  const from = env.EMAIL_FROM?.trim();

  if (!apiKey || !to || !from) {
    warnOwnerEmailDisabled();
    return null;
  }

  return { apiKey, to, from };
}

export function warnOwnerEmailDisabled(): void {
  if (missingConfigWarned) return;
  missingConfigWarned = true;
  logger.warn("notification_disabled");
}
