import "server-only";

import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import type { CheckoutFormData } from "@/lib/checkout-schema";
import { generateOrderAccessToken } from "@/lib/crypto";
import { calculateShippingFee } from "@/lib/shipping";

type PricedLine = {
  unitPrice: number;
  quantity: number;
};

export function calculateOrderTotals(lines: readonly PricedLine[]) {
  if (lines.length === 0) {
    throw new RangeError("An order must contain at least one item.");
  }

  const subtotal = lines.reduce(
    (sum, line) => sum + line.unitPrice * line.quantity,
    0,
  );
  const shipping = calculateShippingFee(subtotal);
  return { subtotal, shipping, total: subtotal + shipping };
}

export type OrderCreationResult =
  | { status: "created"; orderNumber: string; accessToken: string }
  | { status: "duplicate"; orderNumber: string }
  | { status: "rejected"; reason: "empty" | "review" | "stock" };

class CheckoutRejected extends Error {
  constructor(readonly reason: "empty" | "review" | "stock") {
    super(reason);
  }
}

const orderYearFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "Asia/Karachi",
  year: "numeric",
});

export function getOrderYear(now: Date = new Date()): number {
  return Number(orderYearFormatter.format(now));
}

async function lockCart(
  transaction: Prisma.TransactionClient,
  cartId: string,
): Promise<void> {
  await transaction.$queryRaw<Array<{ id: string }>>`
    SELECT "id" FROM "Cart" WHERE "id" = ${cartId} FOR UPDATE
  `;
}

async function nextOrderNumber(
  transaction: Prisma.TransactionClient,
  year: number,
): Promise<string> {
  const rows = await transaction.$queryRaw<Array<{ value: number }>>`
    INSERT INTO "OrderCounter" ("year", "value")
    VALUES (${year}, 1)
    ON CONFLICT ("year") DO UPDATE
      SET "value" = "OrderCounter"."value" + 1
    RETURNING "value"
  `;
  const value = rows[0]?.value;
  if (!Number.isInteger(value) || value < 1) {
    throw new Error("The order counter did not return a valid value.");
  }
  return `AP-${year}-${String(value).padStart(4, "0")}`;
}

export async function findOrderByIdempotencyKey(
  idempotencyKey: string,
): Promise<{ orderNumber: string } | null> {
  return prisma.order.findUnique({
    where: { idempotencyKey },
    select: { orderNumber: true },
  });
}

export async function createOrderFromCart(
  data: CheckoutFormData,
  cartId: string | null,
): Promise<OrderCreationResult> {
  const existing = await findOrderByIdempotencyKey(data.idempotencyKey);
  if (existing) {
    return { status: "duplicate", orderNumber: existing.orderNumber };
  }

  const { rawToken, tokenHash } = generateOrderAccessToken();

  try {
    return await prisma.$transaction(async (transaction) => {
      const retriedOrder = await transaction.order.findUnique({
        where: { idempotencyKey: data.idempotencyKey },
        select: { orderNumber: true },
      });
      if (retriedOrder) {
        return { status: "duplicate", orderNumber: retriedOrder.orderNumber };
      }
      if (!cartId) throw new CheckoutRejected("empty");

      await lockCart(transaction, cartId);

      const cart = await transaction.cart.findUnique({
        where: { id: cartId },
        include: {
          items: {
            include: {
              variant: {
                include: { product: true },
              },
            },
          },
        },
      });
      if (!cart || cart.items.length === 0) {
        throw new CheckoutRejected("empty");
      }

      for (const item of cart.items) {
        const { variant } = item;
        if (variant.product.status !== "PUBLISHED") {
          throw new CheckoutRejected("review");
        }
        if (!variant.product.madeToOrder && variant.stock < item.quantity) {
          throw new CheckoutRejected("review");
        }
      }

      await transaction.$queryRaw`
        SELECT 1 AS locked FROM (SELECT pg_advisory_xact_lock(48201937)) AS advisory
      `;

      const latestRetry = await transaction.order.findUnique({
        where: { idempotencyKey: data.idempotencyKey },
        select: { orderNumber: true },
      });
      if (latestRetry) {
        return { status: "duplicate", orderNumber: latestRetry.orderNumber };
      }

      const totals = calculateOrderTotals(
        cart.items.map((item) => ({
          unitPrice: item.variant.price,
          quantity: item.quantity,
        })),
      );
      const orderNumber = await nextOrderNumber(transaction, getOrderYear());

      for (const item of cart.items) {
        if (item.variant.product.madeToOrder) continue;

        const decrement = await transaction.variant.updateMany({
          where: {
            id: item.variantId,
            stock: { gte: item.quantity },
            product: { is: { status: "PUBLISHED" } },
          },
          data: { stock: { decrement: item.quantity } },
        });
        if (decrement.count !== 1) {
          throw new CheckoutRejected("stock");
        }
      }

      await transaction.order.create({
        data: {
          orderNumber,
          status: "PENDING",
          paymentMethod: "WALLET_TRANSFER",
          accessTokenHash: tokenHash,
          idempotencyKey: data.idempotencyKey,
          subtotal: totals.subtotal,
          shipping: totals.shipping,
          total: totals.total,
          customerName: data.fullName,
          customerEmail: data.email || null,
          customerPhone: data.mobileNumber,
          addressLine1: data.deliveryAddress,
          city: data.city,
          province: data.province,
          postalCode: data.postalCode || null,
          country: "Pakistan",
          giftNote: data.giftNote || null,
          orderNotes: data.orderNotes || null,
          items: {
            create: cart.items.map((item) => ({
              variantId: item.variantId,
              madeToOrder: item.variant.product.madeToOrder,
              productTitle: item.variant.product.title,
              variantLabel: item.variant.label,
              unitPrice: item.variant.price,
              quantity: item.quantity,
              leadTimeDays: item.variant.product.madeToOrder
                ? item.variant.product.leadTimeDays
                : null,
            })),
          },
        },
      });

      await transaction.cartItem.deleteMany({ where: { cartId } });
      return { status: "created", orderNumber, accessToken: rawToken };
    });
  } catch (error) {
    if (error instanceof CheckoutRejected) {
      return { status: "rejected", reason: error.reason };
    }
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const duplicate = await findOrderByIdempotencyKey(data.idempotencyKey);
      if (duplicate) {
        return { status: "duplicate", orderNumber: duplicate.orderNumber };
      }
    }
    throw error;
  }
}
