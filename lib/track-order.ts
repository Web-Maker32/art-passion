import "server-only";

import { timingSafeEqual } from "node:crypto";
import { io } from "next/cache";
import { prisma } from "@/lib/db";
import { normalizePakistaniPhone } from "@/lib/phone";
import { trackOrderSchema, type TrackedOrder } from "@/lib/track-order-schema";

/** No confirmation token, customer address, payment details, or internal IDs are selected. */
export async function findTrackedOrder(
  input: unknown,
): Promise<TrackedOrder | null> {
  const parsed = trackOrderSchema.safeParse(input);
  if (!parsed.success) return null;
  await io();
  const order = await prisma.order.findUnique({
    where: { orderNumber: parsed.data.orderNumber },
    select: {
      orderNumber: true,
      customerPhone: true,
      status: true,
      total: true,
      courierName: true,
      trackingNumber: true,
      createdAt: true,
      paidAt: true,
      shippedAt: true,
      deliveredAt: true,
      cancelledAt: true,
      items: {
        select: { productTitle: true, variantLabel: true, quantity: true },
      },
      events: {
        where: { toStatus: { not: null } },
        orderBy: { createdAt: "asc" },
        select: { toStatus: true, createdAt: true },
      },
    },
  });
  const storedPhone =
    normalizePakistaniPhone(order?.customerPhone ?? "")?.replace(/\D/g, "") ??
    "000000000000";
  const matches = timingSafeEqual(
    Buffer.from(storedPhone),
    Buffer.from(parsed.data.phone),
  );
  if (!order || !matches) return null;

  const timestamps: TrackedOrder["timestamps"] = [
    { status: "PENDING", at: order.createdAt.toISOString() },
    ...order.events.flatMap((event) =>
      event.toStatus
        ? [{ status: event.toStatus, at: event.createdAt.toISOString() }]
        : [],
    ),
  ];
  for (const [status, date] of [
    ["PAID", order.paidAt],
    ["SHIPPED", order.shippedAt],
    ["DELIVERED", order.deliveredAt],
    ["CANCELLED", order.cancelledAt],
  ] as const) {
    if (date && !timestamps.some((entry) => entry.status === status)) {
      timestamps.push({ status, at: date.toISOString() });
    }
  }
  timestamps.sort((a, b) => a.at.localeCompare(b.at));
  // Deliberate allowlist: never spread a database record into a public response.
  return {
    orderNumber: order.orderNumber,
    status: order.status,
    total: order.total,
    courierName: order.courierName,
    trackingNumber: order.trackingNumber,
    timestamps,
    items: order.items.map(({ productTitle, variantLabel, quantity }) => ({
      productTitle,
      variantLabel,
      quantity,
    })),
  };
}
