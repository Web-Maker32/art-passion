"use server";

import { headers, cookies } from "next/headers";
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

const rateLimitWindowMs = 60_000;
const rateLimitMax = 30;
const rateLimits = new Map<string, { count: number; resetAt: number }>();

async function getRateLimitKey(): Promise<string> {
  const [cookieStore, requestHeaders] = await Promise.all([cookies(), headers()]);
  const cartCookie = cookieStore.get("ap_cart")?.value;
  if (cartCookie) return `cart:${cartCookie}`;

  const ip =
    requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    requestHeaders.get("x-real-ip") ||
    "unknown";
  return `ip:${ip}`;
}

async function isRateLimited(): Promise<boolean> {
  // Phase 8 will replace this per-process limiter with Upstash.
  const key = await getRateLimitKey();
  const now = Date.now();
  const current = rateLimits.get(key);

  if (!current || current.resetAt <= now) {
    rateLimits.set(key, { count: 1, resetAt: now + rateLimitWindowMs });
    if (rateLimits.size > 1_000) {
      for (const [candidate, limit] of rateLimits) {
        if (limit.resetAt <= now) rateLimits.delete(candidate);
      }
    }
    return false;
  }

  current.count += 1;
  return current.count > rateLimitMax;
}

async function safeGetCart() {
  try {
    return await getCart();
  } catch (error) {
    console.error("Unable to read the cart after a cart action.", error);
    return emptyCartView();
  }
}

async function runAction(
  name: string,
  action: () => Promise<CartActionResult>,
): Promise<CartActionResult> {
  let result: CartActionResult;
  try {
    if (await isRateLimited()) {
      result = {
        ok: false,
        message: "Please wait a moment before changing your cart again.",
        cart: await safeGetCart(),
      };
    } else {
      result = await action();
    }
  } catch (error) {
    console.error(`Cart action "${name}" failed.`, error);
    result = {
      ok: false,
      message: "We could not update your cart. Please try again.",
      cart: await safeGetCart(),
    };
  }

  try {
    revalidatePath("/", "layout");
    revalidatePath("/cart");
  } catch (error) {
    console.error(`Cart action "${name}" could not revalidate the UI.`, error);
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
