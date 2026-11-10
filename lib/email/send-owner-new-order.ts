import "server-only";

import { prisma } from "@/lib/db";
import { createResendClient } from "@/lib/email/client";
import { getOwnerEmailConfig } from "@/lib/email/config";
import { buildOwnerNewOrderEmail, type OwnerEmailOrder } from "@/lib/email/template";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";

export type OwnerEmailResult = {
  status: "sent" | "skipped" | "failed";
};

/**
 * Sends one new-order notification to the owner.
 *
 * This never throws: a missing configuration, a failed database read and a
 * failed send all resolve to a status, so an order can never be undone because
 * of an email problem.
 */
export async function sendOwnerNewOrderEmail(
  orderNumber: string,
): Promise<OwnerEmailResult> {
  const config = getOwnerEmailConfig();
  if (!config) {
    return { status: "skipped" };
  }

  try {
    const order = await loadOwnerEmailOrder(orderNumber);
    if (!order) {
      logger.warn("notification_failed");
      return { status: "failed" };
    }

    const siteUrl = env.NEXT_PUBLIC_SITE_URL.replace(/\/+$/, "");
    const message = buildOwnerNewOrderEmail(order, {
      adminOrderUrl: `${siteUrl}/admin/orders/${encodeURIComponent(order.orderNumber)}`,
    });

    const { error } = await createResendClient(config.apiKey).emails.send({
      from: config.from,
      to: config.to,
      subject: message.subject,
      html: message.html,
      text: message.text,
    });

    if (error) {
      logger.warn("notification_failed");
      return { status: "failed" };
    }

    return { status: "sent" };
  } catch {
    logger.warn("notification_failed");
    return { status: "failed" };
  }
}

/**
 * Reads only what the email shows. The access token hash is never selected and
 * never logged.
 */
async function loadOwnerEmailOrder(orderNumber: string): Promise<OwnerEmailOrder | null> {
  return prisma.order.findUnique({
    where: { orderNumber },
    select: {
      orderNumber: true,
      createdAt: true,
      status: true,
      paymentMethod: true,
      subtotal: true,
      shipping: true,
      total: true,
      customerName: true,
      customerPhone: true,
      customerEmail: true,
      addressLine1: true,
      addressLine2: true,
      city: true,
      province: true,
      postalCode: true,
      country: true,
      giftNote: true,
      orderNotes: true,
      items: {
        select: {
          productTitle: true,
          variantLabel: true,
          unitPrice: true,
          quantity: true,
        },
        orderBy: { id: "asc" },
      },
    },
  });
}
