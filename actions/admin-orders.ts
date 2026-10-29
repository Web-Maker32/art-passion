"use server";

import { revalidatePath } from "next/cache";
import { assertAdmin } from "@/lib/admin-auth";
import {
  changeOrderStatus,
  type ChangeOrderStatusResult,
} from "@/lib/admin-orders";
import {
  cancelOrderSchema,
  markDeliveredSchema,
  markPaidSchema,
  shipOrderSchema,
} from "@/lib/admin-order-status";

export type AdminOrderActionResult =
  | { success: true; message: string }
  | { success: false; message: string };

const unauthorizedResult: AdminOrderActionResult = {
  success: false,
  message: "Your session expired. Please sign in again.",
};

function firstIssueMessage(error: { issues: Array<{ message: string }> }): string {
  return error.issues[0]?.message ?? "Invalid request.";
}

function revalidateOrderPaths(orderNumber: string): void {
  revalidatePath(`/admin/orders/${orderNumber}`);
  revalidatePath("/admin/orders");
  revalidatePath("/admin");
}

function toActionResult(
  result: ChangeOrderStatusResult,
  orderNumber: string,
  successMessage: string,
): AdminOrderActionResult {
  switch (result.status) {
    case "changed":
      revalidateOrderPaths(orderNumber);
      return { success: true, message: successMessage };
    case "not_found":
      return { success: false, message: "That order could not be found." };
    case "invalid_transition":
      return {
        success: false,
        message: "That status change is not allowed from the order's current state.",
      };
    case "conflict":
      return {
        success: false,
        message: "The order changed while you were working. Refresh and try again.",
      };
  }
}

export async function markOrderPaid(
  input: unknown,
): Promise<AdminOrderActionResult> {
  const auth = await assertAdmin();
  if (!auth.authorized) return unauthorizedResult;

  const parsed = markPaidSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: firstIssueMessage(parsed.error) };
  }

  const result = await changeOrderStatus({
    orderNumber: parsed.data.orderNumber,
    toStatus: "PAID",
    paymentReference: parsed.data.paymentReference ?? null,
  });
  return toActionResult(result, parsed.data.orderNumber, "Order marked as paid.");
}

export async function shipOrder(
  input: unknown,
): Promise<AdminOrderActionResult> {
  const auth = await assertAdmin();
  if (!auth.authorized) return unauthorizedResult;

  const parsed = shipOrderSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: firstIssueMessage(parsed.error) };
  }

  const result = await changeOrderStatus({
    orderNumber: parsed.data.orderNumber,
    toStatus: "SHIPPED",
    courierName: parsed.data.courierName ?? null,
    trackingNumber: parsed.data.trackingNumber ?? null,
  });
  return toActionResult(result, parsed.data.orderNumber, "Order marked as shipped.");
}

export async function markOrderDelivered(
  input: unknown,
): Promise<AdminOrderActionResult> {
  const auth = await assertAdmin();
  if (!auth.authorized) return unauthorizedResult;

  const parsed = markDeliveredSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: firstIssueMessage(parsed.error) };
  }

  const result = await changeOrderStatus({
    orderNumber: parsed.data.orderNumber,
    toStatus: "DELIVERED",
  });
  return toActionResult(result, parsed.data.orderNumber, "Order marked as delivered.");
}

export async function cancelOrder(
  input: unknown,
): Promise<AdminOrderActionResult> {
  const auth = await assertAdmin();
  if (!auth.authorized) return unauthorizedResult;

  const parsed = cancelOrderSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: firstIssueMessage(parsed.error) };
  }

  const result = await changeOrderStatus({
    orderNumber: parsed.data.orderNumber,
    toStatus: "CANCELLED",
    note: parsed.data.note ?? null,
  });
  return toActionResult(result, parsed.data.orderNumber, "Order cancelled and stock restored.");
}
