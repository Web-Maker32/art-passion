import { after } from "next/server";
import { sendOwnerNewOrderEmail } from "@/lib/email/send-owner-new-order";

/**
 * Runs the owner notification after the checkout response has been sent, so the
 * customer never waits for it.
 *
 * `after` throws outside a request scope (scripts, tests), and that must not
 * reach the caller either, so the fallback is a fire-and-forget call whose
 * errors are already contained inside `sendOwnerNewOrderEmail`.
 */
export function notifyOwnerOfNewOrder(orderNumber: string): void {
  const run = async (): Promise<void> => {
    try {
      await sendOwnerNewOrderEmail(orderNumber);
    } catch (error) {
      console.warn(
        `Owner notification for ${orderNumber} failed:`,
        error instanceof Error ? error.message : "unknown error",
      );
    }
  };

  try {
    after(run);
  } catch {
    void run();
  }
}
