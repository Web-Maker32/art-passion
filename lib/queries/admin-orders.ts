import "server-only";

import { OrderStatus, Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { getKarachiDayStart, getKarachiMonthStart } from "@/lib/admin-datetime";

const PAID_LIKE_STATUSES: OrderStatus[] = ["PAID", "SHIPPED", "DELIVERED"];

export const ADMIN_ORDERS_PAGE_SIZE = 20;

/** Search terms are capped so one request cannot scan unbounded text. */
export const ADMIN_ORDER_SEARCH_MAX_LENGTH = 64;

const DAY_MS = 86_400_000;

export type AdminOrderDateRange = "7d" | "30d" | "all";

export type AdminOrderListFilters = {
  status?: OrderStatus | "ALL";
  search?: string;
  page?: number;
  dateRange?: AdminOrderDateRange;
  paymentReported?: boolean;
};

export type AdminOrderListRow = {
  id: string;
  orderNumber: string;
  createdAt: Date;
  customerName: string;
  customerPhone: string;
  total: number;
  status: OrderStatus;
  paymentReportedAt: Date | null;
};

export type AdminOrderStatusCounts = Record<OrderStatus | "ALL", number>;

export type AdminOrderListResult = {
  orders: AdminOrderListRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  counts: AdminOrderStatusCounts;
};

function buildListWhere(
  filters: AdminOrderListFilters,
  now: Date,
): Prisma.OrderWhereInput {
  const where: Prisma.OrderWhereInput = {};

  if (filters.status && filters.status !== "ALL") {
    where.status = filters.status;
  }

  // Prisma parameterises all values (no raw SQL), so `contains` is safe from
  // injection; trimming and the length cap keep the query bounded.
  const search = filters.search?.trim().slice(0, ADMIN_ORDER_SEARCH_MAX_LENGTH);
  if (search) {
    where.OR = [
      { orderNumber: { contains: search, mode: "insensitive" } },
      { customerName: { contains: search, mode: "insensitive" } },
      { customerPhone: { contains: search, mode: "insensitive" } },
    ];
  }

  if (filters.dateRange === "7d" || filters.dateRange === "30d") {
    const days = filters.dateRange === "7d" ? 6 : 29;
    where.createdAt = {
      gte: new Date(getKarachiDayStart(now).getTime() - days * DAY_MS),
    };
  }

  if (filters.paymentReported) {
    where.paymentReportedAt = { not: null };
  }

  return where;
}

export async function listAdminOrders(
  filters: AdminOrderListFilters = {},
  now: Date = new Date(),
): Promise<AdminOrderListResult> {
  const pageSize = ADMIN_ORDERS_PAGE_SIZE;
  const page = Math.max(1, filters.page ?? 1);
  const where = buildListWhere(filters, now);

  const [total, orders, statusGroups] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        orderNumber: true,
        createdAt: true,
        customerName: true,
        customerPhone: true,
        total: true,
        status: true,
        paymentReportedAt: true,
      },
    }),
    // Tab counts honour search/date/payment filters but not the status tab.
    prisma.order.groupBy({
      by: ["status"],
      where: buildListWhere({ ...filters, status: "ALL" }, now),
      _count: { _all: true },
    }),
  ]);

  const counts = Object.fromEntries(
    Object.values(OrderStatus).map((status) => [status, 0]),
  ) as AdminOrderStatusCounts;
  counts.ALL = 0;
  for (const group of statusGroups) {
    counts[group.status] = group._count._all;
    counts.ALL += group._count._all;
  }

  return {
    orders,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    counts,
  };
}

export const adminOrderDetailSelect = {
  id: true,
  orderNumber: true,
  createdAt: true,
  status: true,
  paymentMethod: true,
  paymentReference: true,
  paymentNote: true,
  paymentReportedAt: true,
  paidAt: true,
  shippedAt: true,
  deliveredAt: true,
  cancelledAt: true,
  subtotal: true,
  shipping: true,
  total: true,
  customerName: true,
  customerEmail: true,
  customerPhone: true,
  addressLine1: true,
  addressLine2: true,
  city: true,
  province: true,
  postalCode: true,
  country: true,
  giftNote: true,
  orderNotes: true,
  courierName: true,
  trackingNumber: true,
  stockRestoredAt: true,
  items: {
    orderBy: { id: "asc" },
    select: {
      id: true,
      productTitle: true,
      variantLabel: true,
      unitPrice: true,
      quantity: true,
      leadTimeDays: true,
      madeToOrder: true,
    },
  },
  events: {
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      type: true,
      fromStatus: true,
      toStatus: true,
      note: true,
      createdAt: true,
    },
  },
} satisfies Prisma.OrderSelect;

export type AdminOrderDetail = Prisma.OrderGetPayload<{
  select: typeof adminOrderDetailSelect;
}>;

export async function getAdminOrder(
  orderNumber: string,
): Promise<AdminOrderDetail | null> {
  return prisma.order.findUnique({
    where: { orderNumber },
    select: adminOrderDetailSelect,
  });
}

export type AdminDashboardStats = {
  pending: number;
  paid: number;
  shipped: number;
  today: number;
  paidThisMonthCount: number;
  paidThisMonthTotal: number;
};

/**
 * "Paid this month" sums orders currently in PAID/SHIPPED/DELIVERED whose PAID
 * transition (recorded as an OrderEvent) happened in the current Karachi month.
 * Orders paid before this feature existed have no PAID event and are therefore
 * excluded from the monthly figure.
 */
export async function getAdminDashboardStats(
  now: Date = new Date(),
): Promise<AdminDashboardStats> {
  const dayStart = getKarachiDayStart(now);
  const monthStart = getKarachiMonthStart(now);

  const [pending, paid, shipped, today, paidEvents] = await Promise.all([
    prisma.order.count({ where: { status: "PENDING" } }),
    prisma.order.count({ where: { status: "PAID" } }),
    prisma.order.count({ where: { status: "SHIPPED" } }),
    prisma.order.count({ where: { createdAt: { gte: dayStart } } }),
    prisma.orderEvent.findMany({
      where: {
        toStatus: "PAID",
        createdAt: { gte: monthStart },
        order: { status: { in: PAID_LIKE_STATUSES } },
      },
      select: { orderId: true, order: { select: { total: true } } },
    }),
  ]);

  const seen = new Set<string>();
  let paidThisMonthTotal = 0;
  let paidThisMonthCount = 0;
  for (const event of paidEvents) {
    if (seen.has(event.orderId)) continue;
    seen.add(event.orderId);
    paidThisMonthCount += 1;
    paidThisMonthTotal += event.order.total;
  }

  return {
    pending,
    paid,
    shipped,
    today,
    paidThisMonthCount,
    paidThisMonthTotal,
  };
}
