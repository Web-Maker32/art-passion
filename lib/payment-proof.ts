import "server-only";

import { prisma } from "@/lib/db";
import {
  getOrderAccessCookieValue,
  selectOrderAccessToken,
} from "@/lib/order-access";
import type { PaymentProofInput } from "@/lib/payment-proof-schema";

export type SavePaymentProofResult =
  | { status: "saved" }
  | { status: "unverified" }
  | { status: "not_pending" };

/**
 * Stores the customer-reported Easypaisa transaction ID on an order the
 * customer can prove access to with the order token (URL or cookie).
 *
 * Only the reference, note and report time are written: the amount, the totals
 * and the order status stay owned by the admin review flow. The write is a
 * compare-and-set on PENDING, so it can never overwrite an order the owner has
 * already moved on.
 */
export async function savePaymentProof(
  input: PaymentProofInput,
): Promise<SavePaymentProofResult> {
  const { orderNumber, token, transactionId } = input;

  const order = await prisma.order.findUnique({
    where: { orderNumber },
    select: { status: true, accessTokenHash: true },
  });
  if (!order) return { status: "unverified" };

  const cookieValue = await getOrderAccessCookieValue(orderNumber);
  const verified = selectOrderAccessToken({
    orderNumber,
    storedHash: order.accessTokenHash,
    urlToken: token || null,
    cookieValue,
  });
  if (!verified) return { status: "unverified" };
  if (order.status !== "PENDING") return { status: "not_pending" };

  const updated = await prisma.order.updateMany({
    where: { orderNumber, status: "PENDING" },
    data: {
      paymentReference: transactionId,
      paymentNote: input.note?.trim() || null,
      paymentReportedAt: new Date(),
    },
  });

  return updated.count === 1 ? { status: "saved" } : { status: "not_pending" };
}
