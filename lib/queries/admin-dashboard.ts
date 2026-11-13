import "server-only";

import type { OrderStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { getKarachiDayStart, karachiCalendarDate } from "@/lib/admin-datetime";
import { siteConfig, isOwnerTodo } from "@/lib/site-config";
import { faqItems, contactDetails } from "@/lib/content/faq";
import { legalReviewNote } from "@/lib/content/legal";
import {
  ADMIN_LOW_STOCK_THRESHOLD,
  getAdminProductStats,
  type AdminProductDashboardStats,
} from "@/lib/queries/admin-products";

const DAY_MS = 86_400_000;

/**
 * Orders whose current status counts toward revenue. PENDING, CANCELLED and
 * REFUNDED orders never count, even if they were once paid.
 */
export const REVENUE_STATUSES: OrderStatus[] = [
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
];

const chartLabelFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Karachi",
  day: "numeric",
  month: "short",
});

export type DayRangeEntry = {
  /** Karachi calendar date, YYYY-MM-DD. */
  date: string;
  /** Short axis label, e.g. "13 Nov". */
  label: string;
  /** Day-of-month only, for narrow screens. */
  day: string;
};

export type DashboardDayBucket = DayRangeEntry & { count: number };

/** The last `days` Karachi calendar days, oldest first, including today. */
export function buildKarachiDayRange(now: Date, days: number): DayRangeEntry[] {
  const todayStart = getKarachiDayStart(now);
  return Array.from({ length: days }, (_, index) => {
    const start = new Date(todayStart.getTime() - (days - 1 - index) * DAY_MS);
    const date = karachiCalendarDate(start);
    return {
      date,
      label: chartLabelFormatter.format(start),
      day: date.slice(8),
    };
  });
}

/** Bucket order creation instants into Karachi calendar days. */
export function countOrdersPerDay(
  createdAts: Date[],
  range: DayRangeEntry[],
): DashboardDayBucket[] {
  const counts = new Map<string, number>(range.map((entry) => [entry.date, 0]));
  for (const createdAt of createdAts) {
    const key = karachiCalendarDate(createdAt);
    const current = counts.get(key);
    if (current !== undefined) counts.set(key, current + 1);
  }
  return range.map((entry) => ({
    ...entry,
    count: counts.get(entry.date) ?? 0,
  }));
}

export type RevenueWindows = {
  today: number;
  week: number;
  month: number;
  monthCount: number;
  /** Average order value over the last 30 days, whole rupees. */
  aov30d: number;
};

/**
 * Revenue by order date (Asia/Karachi): today, the last 7 calendar days and
 * the last 30 calendar days, each including today. Only orders whose current
 * status is in REVENUE_STATUSES contribute; the filter is also applied here so
 * the helper stays safe to reuse.
 */
export function summarizeRevenueWindows(
  orders: Array<{ createdAt: Date; total: number; status: OrderStatus }>,
  now: Date,
): RevenueWindows {
  const dayStart = getKarachiDayStart(now).getTime();
  const weekStart = dayStart - 6 * DAY_MS;
  const monthStart = dayStart - 29 * DAY_MS;

  let today = 0;
  let week = 0;
  let month = 0;
  let monthCount = 0;
  for (const order of orders) {
    if (!REVENUE_STATUSES.includes(order.status)) continue;
    const created = order.createdAt.getTime();
    if (created < monthStart) continue;
    month += order.total;
    monthCount += 1;
    if (created >= weekStart) week += order.total;
    if (created >= dayStart) today += order.total;
  }

  return {
    today,
    week,
    month,
    monthCount,
    aov30d: monthCount > 0 ? Math.round(month / monthCount) : 0,
  };
}

/** Top products by units sold, aggregated on the order-item title snapshot. */
export function topProductsByUnits(
  items: Array<{ productTitle: string; quantity: number }>,
  limit = 5,
): Array<{ productTitle: string; units: number }> {
  const units = new Map<string, number>();
  for (const item of items) {
    units.set(
      item.productTitle,
      (units.get(item.productTitle) ?? 0) + item.quantity,
    );
  }
  return [...units.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([productTitle, count]) => ({ productTitle, units: count }));
}

/** First name only, so the dashboard never shows full customer names. */
export function customerFirstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? "";
}

export type LaunchChecklistItem = { id: string; label: string; done: boolean };

/**
 * Read-only launch readiness. Reports presence only — never the configured
 * values themselves, which may be private.
 */
export function buildLaunchChecklist(
  sampleProductCount: number,
): LaunchChecklistItem[] {
  const contentHasTodos =
    faqItems.some((item) => item.answer.includes("TODO(owner)")) ||
    contactDetails.responseTime.includes("TODO(owner)") ||
    legalReviewNote.includes("TODO(owner)");

  return [
    {
      id: "city",
      label: "Shop city added",
      done: !isOwnerTodo(siteConfig.city),
    },
    {
      id: "whatsapp",
      label: "WhatsApp number added",
      done: !isOwnerTodo(siteConfig.whatsappNumber),
    },
    {
      id: "email",
      label: "Contact email added",
      done: !isOwnerTodo(siteConfig.contactEmail),
    },
    {
      id: "instagram",
      label: "Instagram profile linked",
      done: !isOwnerTodo(siteConfig.instagramUrl),
    },
    {
      id: "facebook",
      label: "Facebook page linked",
      done: !isOwnerTodo(siteConfig.facebookUrl),
    },
    {
      id: "easypaisa",
      label: "Easypaisa account details added",
      done:
        !isOwnerTodo(siteConfig.easypaisaAccountName) &&
        !isOwnerTodo(siteConfig.easypaisaNumber),
    },
    {
      id: "content",
      label: "FAQ and legal copy finalised (no TODO(owner) markers)",
      done: !contentHasTodos,
    },
    {
      id: "samples",
      label: "Sample products removed",
      done: sampleProductCount === 0,
    },
  ];
}

export type AdminDashboard = {
  attention: {
    pending: number;
    pendingPaymentReported: number;
    awaitingShipment: number;
    lowStock: number;
    outOfStock: number;
  };
  ordersToday: number;
  orders7d: number;
  revenue: RevenueWindows;
  chart: DashboardDayBucket[];
  latestOrders: Array<{
    orderNumber: string;
    customerFirstName: string;
    total: number;
    status: OrderStatus;
    createdAt: Date;
  }>;
  lowStockVariants: AdminProductDashboardStats["lowStockVariants"];
  draftCount: number;
  topProducts: Array<{ productTitle: string; units: number }>;
  checklist: LaunchChecklistItem[];
};

/**
 * Everything the owner dashboard shows, in parallel selected-field reads.
 * No tokens, hashes or full customer contact details are selected.
 */
export async function getAdminDashboard(
  now: Date = new Date(),
): Promise<AdminDashboard> {
  const dayStart = getKarachiDayStart(now);
  const weekStart = new Date(dayStart.getTime() - 6 * DAY_MS);
  const monthStart = new Date(dayStart.getTime() - 29 * DAY_MS);
  const chartRange = buildKarachiDayRange(now, 14);
  const chartStart = new Date(dayStart.getTime() - 13 * DAY_MS);

  const [
    pending,
    pendingPaymentReported,
    awaitingShipment,
    lowStock,
    outOfStock,
    ordersToday,
    orders7d,
    revenueOrders,
    chartOrders,
    latestOrders,
    productStats,
    soldItems,
    sampleProductCount,
  ] = await Promise.all([
    prisma.order.count({ where: { status: "PENDING" } }),
    prisma.order.count({
      where: { status: "PENDING", paymentReportedAt: { not: null } },
    }),
    prisma.order.count({ where: { status: { in: ["PAID", "PROCESSING"] } } }),
    prisma.variant.count({
      where: {
        stock: { gt: 0, lte: ADMIN_LOW_STOCK_THRESHOLD },
        product: { madeToOrder: false },
      },
    }),
    prisma.variant.count({
      where: { stock: 0, product: { madeToOrder: false } },
    }),
    prisma.order.count({ where: { createdAt: { gte: dayStart } } }),
    prisma.order.count({ where: { createdAt: { gte: weekStart } } }),
    prisma.order.findMany({
      where: {
        createdAt: { gte: monthStart },
        status: { in: REVENUE_STATUSES },
      },
      select: { createdAt: true, total: true, status: true },
    }),
    prisma.order.findMany({
      where: { createdAt: { gte: chartStart } },
      select: { createdAt: true },
    }),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        orderNumber: true,
        customerName: true,
        total: true,
        status: true,
        createdAt: true,
      },
    }),
    getAdminProductStats(),
    prisma.orderItem.findMany({
      where: {
        order: {
          createdAt: { gte: monthStart },
          status: { in: REVENUE_STATUSES },
        },
      },
      select: { productTitle: true, quantity: true },
    }),
    prisma.product.count({ where: { title: { startsWith: "Sample:" } } }),
  ]);

  return {
    attention: {
      pending,
      pendingPaymentReported,
      awaitingShipment,
      lowStock,
      outOfStock,
    },
    ordersToday,
    orders7d,
    revenue: summarizeRevenueWindows(revenueOrders, now),
    chart: countOrdersPerDay(
      chartOrders.map((order) => order.createdAt),
      chartRange,
    ),
    latestOrders: latestOrders.map((order) => ({
      orderNumber: order.orderNumber,
      customerFirstName: customerFirstName(order.customerName),
      total: order.total,
      status: order.status,
      createdAt: order.createdAt,
    })),
    lowStockVariants: productStats.lowStockVariants,
    draftCount: productStats.draftCount,
    topProducts: topProductsByUnits(soldItems),
    checklist: buildLaunchChecklist(sampleProductCount),
  };
}
