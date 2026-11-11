"use server";

import { revalidatePath } from "next/cache";
import {
  paymentProofSavedMessage,
  paymentProofSchema,
} from "@/lib/payment-proof-schema";
import { savePaymentProof } from "@/lib/payment-proof";
import { consumeRateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

export type PaymentProofActionResult =
  | { success: true; message: string }
  | {
      success: false;
      message: string;
      fieldErrors?: Record<string, string>;
      retryAfterSeconds?: number;
    };

/**
 * Public endpoint: the token check happens in savePaymentProof, never here.
 * The transaction ID is stored on the order only; it is never logged or
 * emailed.
 */
export async function reportPaymentProof(
  input: unknown,
): Promise<PaymentProofActionResult> {
  try {
    const limit = await consumeRateLimit("paymentProof");
    if (!limit.allowed) {
      return {
        success: false,
        message: "Too many attempts. Wait a few minutes and try again.",
        retryAfterSeconds: limit.retryAfterSeconds,
      };
    }

    const parsed = paymentProofSchema.safeParse(input);
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

    const result = await savePaymentProof(parsed.data);

    if (result.status === "unverified") {
      return {
        success: false,
        message: "We could not verify this order confirmation.",
      };
    }
    if (result.status === "not_pending") {
      return {
        success: false,
        message:
          "This order is no longer waiting for payment details. Message us on WhatsApp if something looks wrong.",
      };
    }

    revalidatePath(`/order/${parsed.data.orderNumber}`);
    revalidatePath(`/admin/orders/${parsed.data.orderNumber}`);
    revalidatePath("/admin/orders");

    return { success: true, message: paymentProofSavedMessage };
  } catch {
    logger.error("payment_proof_failed");
    return {
      success: false,
      message: "We could not save your payment details. Please try again.",
    };
  }
}
