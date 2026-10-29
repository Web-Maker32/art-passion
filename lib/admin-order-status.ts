import { z } from "zod";
import type { OrderStatus } from "@/generated/prisma/client";

/**
 * Allowed forward transitions. REFUNDED is intentionally not a target in this
 * phase; refunds are handled manually and recorded as a note for now.
 */
const orderStatusTransitions: Record<OrderStatus, readonly OrderStatus[]> = {
  PENDING: ["PAID", "CANCELLED"],
  PAID: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
  REFUNDED: [],
};

export function canTransitionOrderStatus(
  from: OrderStatus,
  to: OrderStatus,
): boolean {
  return orderStatusTransitions[from]?.includes(to) ?? false;
}

export function allowedNextStatuses(from: OrderStatus): readonly OrderStatus[] {
  return orderStatusTransitions[from] ?? [];
}

const orderNumberSchema = z.string().regex(/^AP-\d{4}-\d{4,}$/, {
  message: "Unknown order number.",
});

const optionalNote = z.string().trim().max(500).optional().or(z.literal(""));

export const markPaidSchema = z.object({
  orderNumber: orderNumberSchema,
  paymentReference: optionalNote,
});

export const shipOrderSchema = z.object({
  orderNumber: orderNumberSchema,
  courierName: z.string().trim().max(120).optional().or(z.literal("")),
  trackingNumber: z.string().trim().max(120).optional().or(z.literal("")),
});

export const markDeliveredSchema = z.object({
  orderNumber: orderNumberSchema,
});

export const cancelOrderSchema = z.object({
  orderNumber: orderNumberSchema,
  note: optionalNote,
});

export const adminLoginSchema = z.object({
  email: z
    .string()
    .trim()
    .max(200)
    .refine((value) => z.email().safeParse(value).success, "Enter a valid email address."),
  password: z.string().min(1, "Enter your password.").max(200),
});
