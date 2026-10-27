import "server-only";

import { createHash, createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { addQuantityWithinLimits, buildCartView } from "@/lib/cart-domain";
import { emptyCartView } from "@/lib/cart-types";
import type { CartActionResult, CartView } from "@/lib/cart-types";

const cartCookieName = "ap_cart";
const cartCookieMaxAge = 60 * 60 * 24 * 30;

const cartInclude = {
  items: {
    include: {
      variant: {
        include: {
          product: {
            include: {
              images: {
                orderBy: { position: "asc" },
                take: 1,
                select: { url: true, alt: true },
              },
            },
          },
        },
      },
    },
  },
} satisfies Prisma.CartInclude;

type CartRecord = Prisma.CartGetPayload<{ include: typeof cartInclude }>;

function getCookieSecret(): string {
  const secret = process.env.CART_COOKIE_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("CART_COOKIE_SECRET must be configured with at least 32 characters.");
  }
  return secret;
}

function signToken(token: string): string {
  return createHmac("sha256", getCookieSecret()).update(token).digest("hex");
}

function parseSignedToken(value: string | undefined): string | null {
  if (!value) return null;
  const match = /^([0-9a-f-]{36})\.([0-9a-f]{64})$/i.exec(value);
  if (!match) return null;

  const [, token, signature] = match;
  const expected = Buffer.from(signToken(token), "hex");
  const actual = Buffer.from(signature, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected)
    ? token
    : null;
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function createSignedToken(): { token: string; value: string } {
  const token = randomUUID();
  return { token, value: `${token}.${signToken(token)}` };
}

function toCartView(cart: CartRecord) {
  // unitPrice is only a comparison snapshot; Phase 4 checkout must recalculate
  // totals from current database prices and never use this field for charging.
  return buildCartView(cart.id, cart.items);
}

async function readCart(token: string): Promise<CartRecord | null> {
  return prisma.cart.findUnique({
    where: { token: hashToken(token) },
    include: cartInclude,
  });
}

async function lockCart(
  transaction: Prisma.TransactionClient,
  cartId: string,
): Promise<void> {
  await transaction.$queryRaw<Array<{ id: string }>>`
    SELECT "id" FROM "Cart" WHERE "id" = ${cartId} FOR UPDATE
  `;
}

export async function getCart(): Promise<CartView> {
  const cookieStore = await cookies();
  const token = parseSignedToken(cookieStore.get(cartCookieName)?.value);
  if (!token) return emptyCartView();

  const cart = await readCart(token);
  return cart ? toCartView(cart) : emptyCartView();
}

export async function getCurrentCartIdForCheckout(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = parseSignedToken(cookieStore.get(cartCookieName)?.value);
  if (!token) return null;

  const cart = await prisma.cart.findUnique({
    where: { token: hashToken(token) },
    select: { id: true },
  });
  return cart?.id ?? null;
}

export async function clearCartCookieAfterCheckout(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(cartCookieName);
}

export async function addItem(
  variantId: string,
  requestedQuantity: number,
): Promise<CartActionResult> {
  if (!variantId || !Number.isInteger(requestedQuantity) || requestedQuantity < 1 || requestedQuantity > 20) {
    return { ok: false, message: "Choose a quantity from 1 to 20.", cart: await getCart() };
  }

  const cookieStore = await cookies();
  const existingToken = parseSignedToken(cookieStore.get(cartCookieName)?.value);
  const signed = existingToken
    ? { token: existingToken, value: null }
    : createSignedToken();

  const outcome = await prisma.$transaction(async (transaction) => {
    const variant = await transaction.variant.findUnique({
      where: { id: variantId },
      select: {
        id: true,
        price: true,
        stock: true,
        product: { select: { status: true } },
      },
    });
    if (!variant || variant.product.status !== "PUBLISHED") {
      return { ok: false, message: "This product is no longer available." };
    }
    if (variant.stock <= 0) {
      return { ok: false, message: "This variant is out of stock." };
    }

    const cart = await transaction.cart.upsert({
      where: { token: hashToken(signed.token) },
      update: {},
      create: { token: hashToken(signed.token) },
      select: { id: true },
    });
    await lockCart(transaction, cart.id);

    const previous = await transaction.cartItem.findUnique({
      where: {
        cartId_variantId: { cartId: cart.id, variantId: variant.id },
      },
      select: { quantity: true },
    });
    const { quantity, clamped } = addQuantityWithinLimits(
      previous?.quantity ?? 0,
      requestedQuantity,
      variant.stock,
    );
    if (quantity < 1) {
      return { ok: false, message: `Only ${variant.stock} in stock.` };
    }

    await transaction.cartItem.upsert({
      where: {
        cartId_variantId: { cartId: cart.id, variantId: variant.id },
      },
      update: { quantity, unitPrice: variant.price },
      create: {
        cartId: cart.id,
        variantId: variant.id,
        quantity,
        unitPrice: variant.price,
      },
    });

    return {
      ok: true,
      message: clamped
        ? `Quantity adjusted to ${quantity} based on available stock.`
        : "Added to cart.",
    };
  });

  if (signed.value && outcome.ok) {
    cookieStore.set(cartCookieName, signed.value, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: cartCookieMaxAge,
    });
  }

  return { ...outcome, cart: await getCart() };
}

export async function updateItem(
  itemId: string,
  requestedQuantity: number,
): Promise<CartActionResult> {
  if (!itemId || !Number.isInteger(requestedQuantity) || requestedQuantity < 0 || requestedQuantity > 20) {
    return { ok: false, message: "Choose a quantity from 0 to 20.", cart: await getCart() };
  }

  const cookieStore = await cookies();
  const token = parseSignedToken(cookieStore.get(cartCookieName)?.value);
  if (!token) {
    return { ok: false, message: "Your cart could not be found.", cart: emptyCartView() };
  }

  const outcome = await prisma.$transaction(async (transaction) => {
    const cart = await transaction.cart.findUnique({
      where: { token: hashToken(token) },
      select: { id: true },
    });
    if (!cart) return { ok: false, message: "Your cart could not be found." };
    await lockCart(transaction, cart.id);

    const item = await transaction.cartItem.findFirst({
      where: { id: itemId, cartId: cart.id },
      include: {
        variant: {
          select: {
            price: true,
            stock: true,
            product: { select: { status: true } },
          },
        },
      },
    });
    if (!item) return { ok: false, message: "This cart item no longer exists." };

    if (requestedQuantity === 0) {
      await transaction.cartItem.delete({ where: { id: item.id } });
      return { ok: true, message: "Item removed from cart." };
    }

    if (
      item.variant.product.status !== "PUBLISHED" ||
      item.variant.stock <= 0
    ) {
      return { ok: false, message: "This item is no longer available." };
    }

    const quantity = Math.min(requestedQuantity, item.variant.stock);
    await transaction.cartItem.update({
      where: { id: item.id },
      data: { quantity, unitPrice: item.variant.price },
    });

    return {
      ok: true,
      message:
        quantity < requestedQuantity
          ? `Quantity adjusted to ${quantity} based on available stock.`
          : "Cart updated.",
    };
  });

  return { ...outcome, cart: await getCart() };
}

export async function removeItem(itemId: string): Promise<CartActionResult> {
  if (!itemId) {
    return { ok: false, message: "Choose a cart item to remove.", cart: await getCart() };
  }

  const cookieStore = await cookies();
  const token = parseSignedToken(cookieStore.get(cartCookieName)?.value);
  if (!token) {
    return { ok: false, message: "Your cart could not be found.", cart: emptyCartView() };
  }

  const outcome = await prisma.$transaction(async (transaction) => {
    const cart = await transaction.cart.findUnique({
      where: { token: hashToken(token) },
      select: { id: true },
    });
    if (!cart) return { ok: false, message: "Your cart could not be found." };
    await lockCart(transaction, cart.id);

    const result = await transaction.cartItem.deleteMany({
      where: { id: itemId, cartId: cart.id },
    });
    return result.count
      ? { ok: true, message: "Item removed from cart." }
      : { ok: false, message: "This cart item no longer exists." };
  });

  return { ...outcome, cart: await getCart() };
}

export async function clearCart(): Promise<CartActionResult> {
  const cookieStore = await cookies();
  const token = parseSignedToken(cookieStore.get(cartCookieName)?.value);
  if (!token) {
    return { ok: true, message: "Your cart is already empty.", cart: emptyCartView() };
  }

  const outcome = await prisma.$transaction(async (transaction) => {
    const cart = await transaction.cart.findUnique({
      where: { token: hashToken(token) },
      select: { id: true },
    });
    if (!cart) return { ok: true, message: "Your cart is already empty." };
    await lockCart(transaction, cart.id);
    await transaction.cartItem.deleteMany({ where: { cartId: cart.id } });
    return { ok: true, message: "Cart cleared." };
  });

  return { ...outcome, cart: await getCart() };
}
