import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { db } = vi.hoisted(() => ({
  db: {
    order: {
      count: vi.fn(),
      findMany: vi.fn(),
      groupBy: vi.fn(),
    },
  },
}));

vi.mock("@/lib/db", () => ({ prisma: db }));

import {
  ADMIN_ORDERS_PAGE_SIZE,
  ADMIN_ORDER_SEARCH_MAX_LENGTH,
  listAdminOrders,
} from "@/lib/queries/admin-orders";

// 13 Nov 2026, 10:00 in Karachi (UTC+05:00).
const NOW = new Date("2026-11-13T05:00:00.000Z");
const DAY_START = new Date("2026-11-12T19:00:00.000Z");

beforeEach(() => {
  vi.clearAllMocks();
  db.order.count.mockResolvedValue(0);
  db.order.findMany.mockResolvedValue([]);
  db.order.groupBy.mockResolvedValue([]);
});

describe("listAdminOrders", () => {
  it("lists newest first with bounded pagination and aggregated tab counts", async () => {
    db.order.count.mockResolvedValue(45);
    db.order.groupBy.mockResolvedValue([
      { status: "PENDING", _count: { _all: 2 } },
      { status: "PAID", _count: { _all: 3 } },
    ]);

    const result = await listAdminOrders({ page: 3 }, NOW);

    const listCall = db.order.findMany.mock.calls[0]?.[0];
    expect(listCall.orderBy).toEqual({ createdAt: "desc" });
    expect(listCall.skip).toBe(2 * ADMIN_ORDERS_PAGE_SIZE);
    expect(listCall.take).toBe(ADMIN_ORDERS_PAGE_SIZE);
    expect(result.total).toBe(45);
    expect(result.totalPages).toBe(3);
    expect(result.counts.ALL).toBe(5);
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
