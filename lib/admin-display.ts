import type { OrderStatus } from "@/generated/prisma/client";
import { formatKarachiDate } from "@/lib/admin-datetime";

/**
 * Pure display helpers shared by admin lists. Kept free of server-only
 * imports so client components (tables, avatars) can use them too.
 */

/** Mirrors ADMIN_LOW_STOCK_THRESHOLD in lib/queries/admin-products.ts. */
const LOW_STOCK_THRESHOLD = 2;

/** Short relative timestamp for admin lists; older items show the Karachi date. */
export function formatRelativeTime(date: Date, now: Date = new Date()): string {
  const diffMs = now.getTime() - date.getTime();
  if (diffMs < 60_000) return "just now";
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatKarachiDate(date);
}

/** Initials for the customer avatar: first + last word, or the first two letters. */
export function customerInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  const first = [...words[0]][0] ?? "";
  if (words.length === 1) {
    return (first + ([...words[0]][1] ?? "")).toUpperCase();
  }
  const last = [...words[words.length - 1]][0] ?? "";
  return (first + last).toUpperCase();
}

/** Mode-aware tints reused from the status tokens — no new palette. */
const AVATAR_TINTS = [
  "bg-status-paid/12 text-status-paid",
  "bg-status-processing/12 text-status-processing",
  "bg-status-shipped/12 text-status-shipped",
  "bg-status-pending/12 text-status-pending",
  "bg-status-delivered/12 text-status-delivered",
  "bg-gold/15 text-gold-text dark:text-gold-light",
];

/** Stable tint for a name so the same customer always gets the same colour. */
export function avatarTintClass(name: string): string {
  let hash = 7;
  for (const char of name) {
    hash = (hash * 31 + (char.codePointAt(0) ?? 0)) >>> 0;
  }
  return AVATAR_TINTS[hash % AVATAR_TINTS.length] ?? "bg-muted text-muted-foreground";
}

export type StockDisplay = {
  label: string;
  tone: "fine" | "low" | "out" | "madeToOrder";
};

/** Stock cell wording: made-to-order never shows a bare dash or a red zero. */
export function getStockDisplay(product: {
  madeToOrder: boolean;
  totalStock: number;
}): StockDisplay {
  if (product.madeToOrder) return { label: "Made to order", tone: "madeToOrder" };
  if (product.totalStock <= 0) return { label: "Out of stock", tone: "out" };
  if (product.totalStock <= LOW_STOCK_THRESHOLD) {
    return { label: `${product.totalStock} low`, tone: "low" };
  }
  return { label: `${product.totalStock} in stock`, tone: "fine" };
}

/** Filled dots for the 4-step order progress; null for cancelled/refunded. */
export function orderProgressStep(status: OrderStatus): number | null {
  switch (status) {
    case "PENDING":
      return 0;
    case "PAID":
      return 1;
    case "PROCESSING":
      return 2;
    case "SHIPPED":
      return 3;
    case "DELIVERED":
      return 4;
    default:
      return null;
  }
}