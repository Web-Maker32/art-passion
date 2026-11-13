import { z } from "zod";
import type { OrderStatus } from "@/generated/prisma/client";
import { normalizePakistaniPhone } from "@/lib/phone";

export const TRACK_ORDER_NOT_FOUND =
  "We could not find an order with those details. Check the order number and phone number, or message us on WhatsApp.";
export const TRACK_ORDER_RATE_LIMITED =
  "Too many attempts. Please wait 15 minutes before trying again, or message us on WhatsApp.";

export const trackOrderSchema = z
  .object({
    orderNumber: z
      .string()
      .trim()
      .max(32)
      .toUpperCase()
      .regex(/^AP-\d{4}-\d{4,10}$/),
    phone: z
      .string()
      .trim()
      .max(32)
      .transform((value, context) => {
        const normalized = normalizePakistaniPhone(value);
        if (!normalized) {
          context.addIssue({
            code: "custom",
            message: "Enter the phone number used at checkout.",
          });
          return z.NEVER;
        }
        return normalized.replace(/\D/g, "");
      }),
  })
  .strict();

export type TrackedOrder = {
  orderNumber: string;
  status: OrderStatus;
  total: number;
  courierName: string | null;
  trackingNumber: string | null;
  timestamps: Array<{ status: OrderStatus; at: string }>;
  items: Array<{
    productTitle: string;
    variantLabel: string;
    quantity: number;
  }>;
};

export type TrackOrderResponse =
  { ok: true; order: TrackedOrder } | { ok: false; message: string };

export const trackOrderStatusMessages: Record<OrderStatus, string> = {
  PENDING: "Your order is awaiting payment confirmation.",
  PAID: "Payment received, we are preparing your order",
  PROCESSING: "Your order is being prepared",
  SHIPPED: "On its way",
  DELIVERED: "Your order has been delivered.",
  CANCELLED: "Your order has been cancelled.",
  REFUNDED: "Your order has been refunded.",
};
