import "server-only";

import { prisma } from "@/lib/db";
import type { OrderStatus } from "@/generated/prisma/client";
import { canTransitionOrderStatus } from "@/lib/admin-order-status";

export const ORDER_EVENT_STATUS_CHANGE = "STATUS_CHANGE";

export type ChangeOrderStatusResult =
  | { status: "changed"; fromStatus: OrderStatus; toStatus: OrderStatus }
  | { status: "not_found" }
  | { status: "invalid_transition"; fromStatus: OrderStatus; toStatus: OrderStatus }
  // The order changed underneath us (compare-and-set failed). Safe to retry.
  | { status: "conflict" };

export type ChangeOrderStatusInput = {
  orderNumber: string;
  toStatus: OrderStatus;
  note?: string | null;
  paymentReference?: string | null;
  courierName?: string | null;
  trackingNumber?: string | null;
  eventType?: string;
};

function clean(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

/**
 * Applies an admin-driven status change inside a single transaction.
 *
 * Concurrency is handled with a compare-and-set `updateMany` keyed on the status
 * we just read (no raw row locks): the write only lands when the order is still
 * in the expected state, so two admins cannot both move the same order. Every
 * successful change writes an OrderEvent, and a cancellation restores stock for
 * non-made-to-order lines exactly once (guarded by `stockRestoredAt`).
 */
export async function changeOrderStatus(
  input: ChangeOrderStatusInput,
): Promise<ChangeOrderStatusResult> {
  const { orderNumber, toStatus } = input;

  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { orderNumber },
      select: {
        id: true,
        status: true,
        stockRestoredAt: true,
        items: {
          select: { variantId: true, quantity: true, madeToOrder: true },
        },
      },
    });

    if (!order) {
      return { status: "not_found" } as const;
    }

    const fromStatus = order.status;
    if (!canTransitionOrderStatus(fromStatus, toStatus)) {
      return { status: "invalid_transition", fromStatus, toStatus } as const;
    }

    const data: {
      status: OrderStatus;
      paymentReference?: string | null;
      courierName?: string | null;
      trackingNumber?: string | null;
      stockRestoredAt?: Date;
    } = { status: toStatus };

    if (toStatus === "PAID") {
      const reference = clean(input.paymentReference);
      if (reference) data.paymentReference = reference;
    }

    if (toStatus === "SHIPPED") {
      const courierName = clean(input.courierName);
      const trackingNumber = clean(input.trackingNumber);
      if (courierName) data.courierName = courierName;
      if (trackingNumber) data.trackingNumber = trackingNumber;
    }

    const shouldRestoreStock =
      toStatus === "CANCELLED" && order.stockRestoredAt === null;
    if (shouldRestoreStock) {
      data.stockRestoredAt = new Date();
    }

    // Compare-and-set: only apply when the order is still in the state we read.
    const updated = await tx.order.updateMany({
      where: { orderNumber, status: fromStatus },
      data,
    });
    if (updated.count !== 1) {
      return { status: "conflict" } as const;
    }

    if (shouldRestoreStock) {
      for (const item of order.items) {
        if (!item.variantId || item.madeToOrder) continue;
        // updateMany tolerates a variant that no longer exists (count 0).
        await tx.variant.updateMany({
          where: { id: item.variantId },
          data: { stock: { increment: item.quantity } },
        });
      }
    }

    await tx.orderEvent.create({
      data: {
        orderId: order.id,
        type: input.eventType ?? ORDER_EVENT_STATUS_CHANGE,
        fromStatus,
        toStatus,
        note: clean(input.note),
      },
    });

    return { status: "changed", fromStatus, toStatus } as const;
  });
}
