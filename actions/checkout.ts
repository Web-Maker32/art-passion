"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { checkoutSchema } from "@/lib/checkout-schema";
import {
  clearCartCookieAfterCheckout,
  getCurrentCartIdForCheckout,
} from "@/lib/cart";
import { setOrderAccessCookie } from "@/lib/order-access";
import { createOrderFromCart, findOrderByIdempotencyKey } from "@/lib/orders";
import { consumeRateLimit } from "@/lib/rate-limit";

export type CheckoutActionResult =
  | { success: true; orderNumber: string; accessToken: string }
  | {
      success: false;
      message: string;
      fieldErrors?: Record<string, string>;
      orderNumber?: string;
    };

const idempotencyKeySchema = z.string().uuid();
const duplicateMessage =
  "This checkout was already submitted. If you need help, contact us on WhatsApp with your order number.";

function readIdempotencyKey(input: unknown): string | null {
  if (!input || typeof input !== "object" || !("idempotencyKey" in input)) {
    return null;
  }
  const parsed = idempotencyKeySchema.safeParse(
    (input as Record<string, unknown>).idempotencyKey,
  );
  return parsed.success ? parsed.data : null;
}

export async function processCheckout(input: unknown): Promise<CheckoutActionResult> {
  try {
    const idempotencyKey = readIdempotencyKey(input);
    if (idempotencyKey) {
      const existing = await findOrderByIdempotencyKey(idempotencyKey);
      if (existing) {
        return {
          success: false,
          message: duplicateMessage,
          orderNumber: existing.orderNumber,
        };
      }
    }

    if (await consumeRateLimit({ scope: "checkout", limit: 6 })) {
      return {
        success: false,
        message: "Please wait a moment before trying again.",
      };
    }

    const parsed = checkoutSchema.safeParse(input);
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

    const cartId = await getCurrentCartIdForCheckout();
    const result = await createOrderFromCart(parsed.data, cartId);

    if (result.status === "duplicate") {
      return {
        success: false,
        message: duplicateMessage,
        orderNumber: result.orderNumber,
      };
    }
    if (result.status === "rejected") {
      const message = {
        empty: "Your cart is empty. Add an item before checking out.",
        review: "Your cart has changed. Review it before placing the order.",
        stock: "Stock changed while placing the order. Review your cart and try again.",
      }[result.reason];
      return { success: false, message };
    }

    await clearCartCookieAfterCheckout();
    await setOrderAccessCookie(result.orderNumber, result.accessToken);
    revalidatePath("/cart");
    revalidatePath("/");
    return {
      success: true,
      orderNumber: result.orderNumber,
      accessToken: result.accessToken,
    };
  } catch (error) {
    console.error("Checkout failed.", error);
    return {
      success: false,
      message: "We could not place your order. Please try again.",
    };
  }
}
