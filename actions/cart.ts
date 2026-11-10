"use server";

import { consumeRateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  addItem,
  clearCart,
  getCart,
  removeItem,
  updateItem,
} from "@/lib/cart";
import { emptyCartView, type CartActionResult } from "@/lib/cart-types";

const addSchema = z
  .object({
    variantId: z.string().min(1).max(128),
    quantity: z.number().int().min(1).max(20),
  })
  .strict();

const updateSchema = z
  .object({
    itemId: z.string().min(1).max(128),
    quantity: z.number().int().min(0).max(20),
  })
  .strict();

const removeSchema = z
  .object({ itemId: z.string().min(1).max(128) })
  .strict();

async function safeGetCart() {
  try {
    return await getCart();
  } catch {
    logger.error("cart_failed");
    return emptyCartView();
  }
}

async function runAction(
  _name: string,
  action: () => Promise<CartActionResult>,
): Promise<CartActionResult> {
  let result: CartActionResult;
  try {
    const limit = await consumeRateLimit("cart");
    if (!limit.allowed) {
      result = {
        ok: false,
        message: "Please wait a moment before changing your cart again.",
        retryAfterSeconds: limit.retryAfterSeconds,
        cart: await safeGetCart(),
      };
    } else {
      result = await action();
    }
  } catch {
    logger.error("cart_failed");
    result = {
      ok: false,
      message: "We could not update your cart. Please try again.",
      cart: await safeGetCart(),
    };
  }

  try {
    revalidatePath("/", "layout");
    revalidatePath("/cart");
  } catch {
    logger.error("revalidation_failed");
    return {
      ok: false,
      message: "Your cart changed, but the page could not be refreshed.",
      cart: await safeGetCart(),
    };
  }
  return result;
}

export async function addToCart(input: unknown): Promise<CartActionResult> {
  const parsed = addSchema.safeParse(input);
  if (!parsed.success) {
    return runAction("add", async () => ({
      ok: false,
      message: "Choose a valid product variant and quantity.",
      cart: await safeGetCart(),
    }));
  }

  return runAction("add", () =>
    addItem(parsed.data.variantId, parsed.data.quantity),
  );
}

export async function updateCartItem(input: unknown): Promise<CartActionResult> {
  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) {
    return runAction("update", async () => ({
      ok: false,
      message: "Choose a valid cart item and quantity.",
      cart: await safeGetCart(),
    }));
  }

  return runAction("update", () =>
    updateItem(parsed.data.itemId, parsed.data.quantity),
  );
}

export async function removeCartItem(input: unknown): Promise<CartActionResult> {
  const parsed = removeSchema.safeParse(input);
  if (!parsed.success) {
    return runAction("remove", async () => ({
      ok: false,
      message: "Choose a valid cart item to remove.",
      cart: await safeGetCart(),
    }));
  }

  return runAction("remove", () => removeItem(parsed.data.itemId));
}

export async function clearCartAction(): Promise<CartActionResult> {
  return runAction("clear", clearCart);
}
