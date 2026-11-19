import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { db } = vi.hoisted(() => ({
  db: {
    order: {
      count: vi.fn(),
      findMany: vi.fn(),
      groupBy: vi.fn(),
    },
    variant: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock("@/lib/db", () => ({ prisma: db }));

import {
  ACTIVE_ORDER_STATUSES,
  ADMIN_ORDERS_PAGE_SIZE,
  ADMIN_ORDER_SEARCH_MAX_LENGTH,
  getAdminOrdersSummary,
  listAdminOrders,
  TO_SHIP_STATUSES,
} from "@/lib/queries/admin-orders";
import { REVENUE_STATUSES } from "@/lib/queries/admin-dashboard";

// 13 Nov 2026, 10:00 in Karachi (UTC+05:00).
const NOW = new Date("2026-11-13T05:00:00.000Z");
const DAY_START = new Date("2026-11-12T19:00:00.000Z");

beforeEach(() => {
  vi.clearAllMocks();
  db.order.count.mockResolvedValue(0);
  db.order.findMany.mockResolvedValue([]);
  db.order.groupBy.mockResolvedValue([]);
  db.variant.findMany.mockResolvedValue([]);
});

describe("listAdminOrders", () => {
  it("lists newest first with bounded pagination and aggregated tab counts", async () => {
    // Count calls in order: page total, then reported-pending priority count.
    db.order.count.mockResolvedValueOnce(45).mockResolvedValueOnce(0);
    db.order.groupBy.mockResolvedValue([
      { status: "PENDING", _count: { _all: 2 } },
      { status: "PAID", _count: { _all: 3 } },
    ]);

    const result = await listAdminOrders({ page: 3 }, NOW);

    const listCall = db.order.findMany.mock.calls[0]?.[0];
    expect(listCall.orderBy).toEqual([
      { createdAt: "desc" },
      { orderNumber: "desc" },
    ]);
    expect(listCall.skip).toBe(2 * ADMIN_ORDERS_PAGE_SIZE);
    expect(listCall.take).toBe(ADMIN_ORDERS_PAGE_SIZE);
    expect(result.total).toBe(45);
    expect(result.totalPages).toBe(3);
    expect(result.counts.ALL).toBe(5);
    expect(result.counts.ACTIVE).toBe(5);
    expect(result.counts.PENDING).toBe(2);
    expect(result.counts.PAID).toBe(3);
    expect(result.counts.SHIPPED).toBe(0);
  });

  it("trims and caps the search term and matches number, name or phone", async () => {
    const longSearch = `  ${"a".repeat(200)}  `;
    await listAdminOrders({ search: longSearch }, NOW);

    const listCall = db.order.findMany.mock.calls[0]?.[0];
    const expected = "a".repeat(ADMIN_ORDER_SEARCH_MAX_LENGTH);
    expect(listCall.where.OR).toEqual([
      { orderNumber: { contains: expected, mode: "insensitive" } },
      { customerName: { contains: expected, mode: "insensitive" } },
      { customerPhone: { contains: expected, mode: "insensitive" } },
    ]);
    // The tab counts use the same bounded search.
    const countsCall = db.order.groupBy.mock.calls[0]?.[0];
    expect(countsCall.where.OR).toEqual(listCall.where.OR);
  });

  it("applies Karachi day boundaries for the 7-day and 30-day filters", async () => {
    await listAdminOrders({ dateRange: "7d" }, NOW);
    expect(db.order.findMany.mock.calls[0]?.[0].where.createdAt).toEqual({
      gte: new Date(DAY_START.getTime() - 6 * 86_400_000),
    });

    vi.clearAllMocks();
    db.order.count.mockResolvedValue(0);
    db.order.findMany.mockResolvedValue([]);
    db.order.groupBy.mockResolvedValue([]);

    await listAdminOrders({ dateRange: "30d" }, NOW);
    expect(db.order.findMany.mock.calls[0]?.[0].where.createdAt).toEqual({
      gte: new Date(DAY_START.getTime() - 29 * 86_400_000),
    });
  });

  it("adds no date filter for all time", async () => {
    await listAdminOrders({ dateRange: "all" }, NOW);
    expect(
      db.order.findMany.mock.calls[0]?.[0].where.createdAt,
    ).toBeUndefined();
  });

  it("filters payment-reported orders and keeps the filter in tab counts", async () => {
    await listAdminOrders({ paymentReported: true }, NOW);
    const expected = { paymentReportedAt: { not: null } };
    expect(
      db.order.findMany.mock.calls[0]?.[0].where.paymentReportedAt,
    ).toEqual(expected.paymentReportedAt);
    expect(db.order.groupBy.mock.calls[0]?.[0].where.paymentReportedAt).toEqual(
      expected.paymentReportedAt,
    );
  });

  it("applies the status tab to the list but not to the tab counts", async () => {
    await listAdminOrders({ status: "PENDING", search: "AP-2026" }, NOW);
    expect(db.order.findMany.mock.calls[0]?.[0].where.status).toBe("PENDING");
    const countsCall = db.order.groupBy.mock.calls[0]?.[0];
    expect(countsCall.where.status).toBeUndefined();
    expect(countsCall.where.OR).toBeDefined();
    expect(countsCall.by).toEqual(["status"]);
  });

  it("clamps invalid pages to the first page", async () => {
    const result = await listAdminOrders({ page: -5 }, NOW);
    expect(result.page).toBe(1);
    expect(db.order.findMany.mock.calls[0]?.[0].skip).toBe(0);
  });

  it("returns a calm empty result for an empty shop", async () => {
    const result = await listAdminOrders({}, NOW);
    expect(result.orders).toEqual([]);
    expect(result.total).toBe(0);
    expect(result.totalPages).toBe(1);
    expect(result.counts.ALL).toBe(0);
  });
});

describe("Active tab and counts", () => {
  it("defaults to Active and excludes cancelled and refunded from the list", async () => {
    await listAdminOrders({}, NOW);
    const listCall = db.order.findMany.mock.calls[0]?.[0];
    expect(listCall.where.status).toEqual({ in: ACTIVE_ORDER_STATUSES });
    expect(ACTIVE_ORDER_STATUSES).not.toContain("CANCELLED");
    expect(ACTIVE_ORDER_STATUSES).not.toContain("REFUNDED");
  });

  it("shows every status on the All tab", async () => {
    await listAdminOrders({ status: "ALL" }, NOW);
    expect(db.order.findMany.mock.calls[0]?.[0].where.status).toBeUndefined();
  });

  it("aggregates tab counts so Active excludes cancelled and refunded", async () => {
    db.order.count.mockResolvedValueOnce(12).mockResolvedValueOnce(0);
    db.order.groupBy.mockResolvedValue([
      { status: "PENDING", _count: { _all: 2 } },
      { status: "PAID", _count: { _all: 3 } },
      { status: "DELIVERED", _count: { _all: 2 } },
      { status: "CANCELLED", _count: { _all: 4 } },
      { status: "REFUNDED", _count: { _all: 1 } },
    ]);
    const result = await listAdminOrders({}, NOW);
    expect(result.counts.ACTIVE).toBe(7);
    expect(result.counts.ALL).toBe(12);
    expect(result.counts.CANCELLED).toBe(4);
    expect(result.counts.REFUNDED).toBe(1);
    expect(result.counts.DELIVERED).toBe(2);
  });
});

describe("To ship tab", () => {
  it("combines PAID and PROCESSING into one read-only filter", async () => {
    db.order.groupBy.mockResolvedValue([
      { status: "PAID", _count: { _all: 2 } },
      { status: "PROCESSING", _count: { _all: 1 } },
      { status: "DELIVERED", _count: { _all: 4 } },
    ]);

    const result = await listAdminOrders({ status: "TO_SHIP" }, NOW);

    expect(TO_SHIP_STATUSES).toEqual(["PAID", "PROCESSING"]);
    expect(db.order.findMany.mock.calls[0]?.[0].where.status).toEqual({
      in: ["PAID", "PROCESSING"],
    });
    expect(result.counts.TO_SHIP).toBe(3);
    expect(result.counts.ACTIVE).toBe(7);
    expect(result.counts.ALL).toBe(7);
    // No reported-pending priority reads on the combined tab.
    expect(db.order.count).toHaveBeenCalledTimes(1);
    expect(db.order.findMany).toHaveBeenCalledTimes(1);
  });

  it("keeps search filters on the list and the tab counts", async () => {
    await listAdminOrders({ status: "TO_SHIP", search: "AP-2026" }, NOW);
    const listCall = db.order.findMany.mock.calls[0]?.[0];
    expect(listCall.where.status).toEqual({ in: TO_SHIP_STATUSES });
    expect(listCall.where.OR).toBeDefined();
    const countsCall = db.order.groupBy.mock.calls[0]?.[0];
    expect(countsCall.where.status).toBeUndefined();
    expect(countsCall.where.OR).toEqual(listCall.where.OR);
  });

  it("counts zero to-ship orders on an empty shop", async () => {
    const result = await listAdminOrders({ status: "TO_SHIP" }, NOW);
    expect(result.counts.TO_SHIP).toBe(0);
  });
});

describe("ordering and tiebreak", () => {
  it("sorts by createdAt desc then orderNumber desc", async () => {
    await listAdminOrders({ status: "PAID" }, NOW);
    expect(db.order.findMany.mock.calls[0]?.[0].orderBy).toEqual([
      { createdAt: "desc" },
      { orderNumber: "desc" },
    ]);
  });

  it("puts reported-pending orders first on Active, then the rest", async () => {
    db.order.count.mockResolvedValueOnce(10).mockResolvedValueOnce(2);
    db.order.findMany.mockResolvedValue([]);
    await listAdminOrders({ status: "ACTIVE" }, NOW);
    const priorityCall = db.order.findMany.mock.calls[0]?.[0];
    expect(priorityCall.where.status).toBe("PENDING");
    expect(priorityCall.where.paymentReportedAt).toEqual({ not: null });
    const restCall = db.order.findMany.mock.calls[1]?.[0];
    expect(restCall.where.NOT).toEqual({
      status: "PENDING",
      paymentReportedAt: { not: null },
    });
    expect(priorityCall.orderBy).toEqual([
      { createdAt: "desc" },
      { orderNumber: "desc" },
    ]);
    expect(restCall.orderBy).toEqual(priorityCall.orderBy);
  });

  it("does not prioritise on tabs other than Active and Pending", async () => {
    await listAdminOrders({ status: "SHIPPED" }, NOW);
    expect(db.order.count).toHaveBeenCalledTimes(1);
    expect(db.order.findMany).toHaveBeenCalledTimes(1);
    expect(db.order.findMany.mock.calls[0]?.[0].where.status).toBe("SHIPPED");
  });
});

describe("getAdminOrdersSummary", () => {
  it("sums revenue statuses only and selects just the total", async () => {
    db.order.count
      .mockResolvedValueOnce(4)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(5)
      .mockResolvedValueOnce(3);
    db.order.findMany.mockResolvedValueOnce([{ total: 1000 }, { total: 2500 }]);

    const summary = await getAdminOrdersSummary(NOW);
    expect(summary).toEqual({
      needsAction: 4,
      needsActionReported: 1,
      toShip: 5,
      deliveredThisMonth: 3,
      revenueThisMonth: 3500,
    });
    const revenueCall = db.order.findMany.mock.calls[0]?.[0];
    expect(revenueCall.where.status).toEqual({ in: REVENUE_STATUSES });
    expect(revenueCall.select).toEqual({ total: true });
  });

  it("uses the Karachi month start for delivered and revenue windows", async () => {
    const monthStart = new Date("2026-10-31T19:00:00.000Z"); // 1 Nov 00:00 PKT
    await getAdminOrdersSummary(NOW);
    expect(db.order.count.mock.calls[3]?.[0].where).toEqual({
      status: "DELIVERED",
      deliveredAt: { gte: monthStart },
    });
    expect(db.order.findMany.mock.calls[0]?.[0].where.createdAt).toEqual({
      gte: monthStart,
    });
  });

  it("rolls the month boundary at Karachi midnight, not UTC", async () => {
    const stillOctober = new Date("2026-10-31T18:59:59.999Z"); // 31 Oct 23:59 PKT
    const november = new Date("2026-10-31T19:00:00.000Z"); // 1 Nov 00:00 PKT
    await getAdminOrdersSummary(stillOctober);
    expect(db.order.findMany.mock.calls[0]?.[0].where.createdAt).toEqual({
      gte: new Date("2026-09-30T19:00:00.000Z"), // 1 Oct 00:00 PKT
    });

    vi.clearAllMocks();
    db.order.count.mockResolvedValue(0);
    db.order.findMany.mockResolvedValue([]);
    await getAdminOrdersSummary(november);
    expect(db.order.findMany.mock.calls[0]?.[0].where.createdAt).toEqual({
      gte: new Date("2026-10-31T19:00:00.000Z"), // 1 Nov 00:00 PKT
    });
  });

  it("returns zeroes for an empty database", async () => {
    const summary = await getAdminOrdersSummary(NOW);
    expect(summary).toEqual({
      needsAction: 0,
      needsActionReported: 0,
      toShip: 0,
      deliveredThisMonth: 0,
      revenueThisMonth: 0,
    });
  });
});
