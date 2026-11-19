import "server-only";

import { OrderStatus, Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { getKarachiDayStart, getKarachiMonthStart } from "@/lib/admin-datetime";
import { REVENUE_STATUSES } from "@/lib/queries/admin-dashboard";

const PAID_LIKE_STATUSES: OrderStatus[] = ["PAID", "SHIPPED", "DELIVERED"];

/** The default "Active" tab: everything except cancelled and refunded. */
export const ACTIVE_ORDER_STATUSES: OrderStatus[] = [
  "PENDING",
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
];

/** Read-only "To ship" tab: paid and processing orders to pack and dispatch. */
export const TO_SHIP_STATUSES: OrderStatus[] = ["PAID", "PROCESSING"];

export const ADMIN_ORDERS_PAGE_SIZE = 20;

/** Search terms are capped so one request cannot scan unbounded text. */
export const ADMIN_ORDER_SEARCH_MAX_LENGTH = 64;

const DAY_MS = 86_400_000;

export type AdminOrderDateRange = "7d" | "30d" | "all";

export type AdminOrderStatusTab = OrderStatus | "ACTIVE" | "TO_SHIP" | "ALL";

export type AdminOrderListFilters = {
  status?: AdminOrderStatusTab;
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
  shipping: number;
  status: OrderStatus;
  paymentReportedAt: Date | null;
  itemCount: number;
  /** First three items, each with the product thumbnail when available. */
  items: Array<{
    productTitle: string;
    thumbnail: { url: string; alt: string } | null;
  }>;
  extraItemCount: number;
};

export type AdminOrderStatusCounts = Record<AdminOrderStatusTab, number>;

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

  if (filters.status === "ACTIVE") {
    where.status = { in: ACTIVE_ORDER_STATUSES };
  } else if (filters.status === "TO_SHIP") {
    where.status = { in: TO_SHIP_STATUSES };
  } else if (filters.status && filters.status !== "ALL") {
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

const LIST_ORDER_BY: Prisma.OrderOrderByWithRelationInput[] = [
  { createdAt: "desc" },
  { orderNumber: "desc" },
];

const listSelect = {
  id: true,
  orderNumber: true,
  createdAt: true,
  customerName: true,
  customerPhone: true,
  total: true,
  shipping: true,
  status: true,
  paymentReportedAt: true,
  items: {
    orderBy: { id: "asc" },
    select: { productTitle: true, variantId: true },
  },
} satisfies Prisma.OrderSelect;

type ListOrderRow = Prisma.OrderGetPayload<{ select: typeof listSelect }>;

/** Resolve one product thumbnail per shown item via a single batched read. */
async function withItemThumbnails(
  rows: ListOrderRow[],
): Promise<AdminOrderListRow[]> {
  const variantIds = [
    ...new Set(
      rows
        .flatMap((row) => row.items.slice(0, 3).map((item) => item.variantId))
        .filter((id): id is string => Boolean(id)),
    ),
  ];
  const variantRows =
    variantIds.length > 0
      ? await prisma.variant.findMany({
          where: { id: { in: variantIds } },
          select: {
            id: true,
            product: {
              select: {
                images: {
                  orderBy: { position: "asc" },
                  take: 1,
                  select: { url: true, alt: true },
                },
              },
            },
          },
        })
      : [];
  const imageByVariantId = new Map<string, { url: string; alt: string } | null>(
    variantRows.map((variant) => [variant.id, variant.product.images[0] ?? null]),
  );

  return rows.map((row) => {
    const items = row.items.slice(0, 3).map((item) => ({
      productTitle: item.productTitle,
      thumbnail: item.variantId
        ? (imageByVariantId.get(item.variantId) ?? null)
        : null,
    }));
    return {
      id: row.id,
      orderNumber: row.orderNumber,
      createdAt: row.createdAt,
      customerName: row.customerName,
      customerPhone: row.customerPhone,
      total: row.total,
      shipping: row.shipping,
      status: row.status,
      paymentReportedAt: row.paymentReportedAt,
      itemCount: row.items.length,
      items,
      extraItemCount: Math.max(0, row.items.length - items.length),
    };
  });
}

export async function listAdminOrders(
  filters: AdminOrderListFilters = {},
  now: Date = new Date(),
): Promise<AdminOrderListResult> {
  const pageSize = ADMIN_ORDERS_PAGE_SIZE;
  const page = Math.max(1, filters.page ?? 1);
  const status: AdminOrderStatusTab = filters.status ?? "ACTIVE";
  const where = buildListWhere({ ...filters, status }, now);
  const skip = (page - 1) * pageSize;

  // In Active and Pending, pending orders with a customer-reported payment
  // come first; everything else follows by order date, newest first, with the
  // order number as a stable tiebreak. Two bounded reads keep the ordering in
  // Prisma (no raw SQL).
  const prioritizeReported = status === "ACTIVE" || status === "PENDING";
  const priorityWhere: Prisma.OrderWhereInput = {
    ...where,
    status: "PENDING",
    paymentReportedAt: { not: null },
  };
  const restWhere: Prisma.OrderWhereInput = {
    ...where,
    NOT: { status: "PENDING", paymentReportedAt: { not: null } },
  };

  const [total, statusGroups, priorityCount] = await Promise.all([
    prisma.order.count({ where }),
    // Tab counts honour search/date/payment filters but not the status tab.
    prisma.order.groupBy({
      by: ["status"],
      where: buildListWhere({ ...filters, status: "ALL" }, now),
      _count: { _all: true },
    }),
    prioritizeReported
      ? prisma.order.count({ where: priorityWhere })
      : Promise.resolve(0),
  ]);

  let rows: ListOrderRow[];
  if (!prioritizeReported) {
    rows = await prisma.order.findMany({
      where,
      orderBy: LIST_ORDER_BY,
      skip,
      take: pageSize,
      select: listSelect,
    });
  } else if (skip < priorityCount) {
    const priorityTake = Math.min(pageSize, priorityCount - skip);
    const priorityRows = await prisma.order.findMany({
      where: priorityWhere,
      orderBy: LIST_ORDER_BY,
      skip,
      take: priorityTake,
      select: listSelect,
    });
    const remaining = pageSize - priorityRows.length;
    const restRows =
      remaining > 0
        ? await prisma.order.findMany({
            where: restWhere,
            orderBy: LIST_ORDER_BY,
            skip: 0,
            take: remaining,
            select: listSelect,
          })
        : [];
    rows = [...priorityRows, ...restRows];
  } else {
    rows = await prisma.order.findMany({
      where: restWhere,
      orderBy: LIST_ORDER_BY,
      skip: skip - priorityCount,
      take: pageSize,
      select: listSelect,
    });
  }

  const orders = await withItemThumbnails(rows);

  const counts = Object.fromEntries(
    Object.values(OrderStatus).map((status) => [status, 0]),
  ) as AdminOrderStatusCounts;
  counts.ACTIVE = 0;
  counts.TO_SHIP = 0;
  counts.ALL = 0;
  for (const group of statusGroups) {
    counts[group.status] = group._count._all;
    counts.ALL += group._count._all;
    if (ACTIVE_ORDER_STATUSES.includes(group.status)) {
      counts.ACTIVE += group._count._all;
    }
    if (TO_SHIP_STATUSES.includes(group.status)) {
      counts.TO_SHIP += group._count._all;
    }
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

export type AdminOrdersSummary = {
  needsAction: number;
  needsActionReported: number;
  toShip: number;
  deliveredThisMonth: number;
  /** Whole rupees, revenue statuses only, current Karachi month. */
  revenueThisMonth: number;
};

/**
 * Shop-wide summary strip for the orders page. Month boundaries use
 * Asia/Karachi; "delivered this month" uses the recorded delivery time and
 * revenue uses the order date, counting only REVENUE_STATUSES.
 */
export async function getAdminOrdersSummary(
  now: Date = new Date(),
): Promise<AdminOrdersSummary> {
  const monthStart = getKarachiMonthStart(now);
  const [needsAction, needsActionReported, toShip, deliveredThisMonth, revenueOrders] =
    await Promise.all([
      prisma.order.count({ where: { status: "PENDING" } }),
      prisma.order.count({
        where: { status: "PENDING", paymentReportedAt: { not: null } },
      }),
      prisma.order.count({ where: { status: { in: TO_SHIP_STATUSES } } }),
      prisma.order.count({
        where: { status: "DELIVERED", deliveredAt: { gte: monthStart } },
      }),
      prisma.order.findMany({
        where: {
          createdAt: { gte: monthStart },
          status: { in: REVENUE_STATUSES },
        },
        select: { total: true },
      }),
    ]);

  return {
    needsAction,
    needsActionReported,
    toShip,
    deliveredThisMonth,
    revenueThisMonth: revenueOrders.reduce((sum, order) => sum + order.total, 0),
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
