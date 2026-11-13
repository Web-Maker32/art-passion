import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

// Deterministic launch-checklist inputs: city and WhatsApp are configured,
// everything else is left as an owner TODO. Values are fictional.
vi.hoisted(() => {
  process.env.SHOP_CITY = "Lahore";
  process.env.WHATSAPP_NUMBER = "923001234567";
  delete process.env.CONTACT_EMAIL;
  delete process.env.INSTAGRAM_URL;
  delete process.env.FACEBOOK_URL;
  delete process.env.EASYPAISA_ACCOUNT_NAME;
  delete process.env.EASYPAISA_NUMBER;
});

const { db } = vi.hoisted(() => ({
  db: {
    order: { count: vi.fn(), findMany: vi.fn() },
    orderItem: { findMany: vi.fn() },
    variant: { count: vi.fn() },
    product: { count: vi.fn() },
  },
}));

vi.mock("@/lib/db", () => ({ prisma: db }));

vi.mock("@/lib/queries/admin-products", () => ({
  ADMIN_LOW_STOCK_THRESHOLD: 2,
  getAdminProductStats: vi.fn(async () => ({
    draftCount: 0,
    lowStockVariants: [],
  })),
}));

import {
  REVENUE_STATUSES,
  buildKarachiDayRange,
  buildLaunchChecklist,
  countOrdersPerDay,
  customerFirstName,
  getAdminDashboard,
  summarizeRevenueWindows,
  topProductsByUnits,
} from "@/lib/queries/admin-dashboard";
import type { OrderStatus } from "@/generated/prisma/client";

// 13 Nov 2026, 10:00 in Karachi (UTC+05:00).
const NOW = new Date("2026-11-13T05:00:00.000Z");
// Start of 13 Nov in Karachi = 12 Nov 19:00 UTC.
const DAY_START = new Date("2026-11-12T19:00:00.000Z");

function order(createdAt: Date, total: number, status: OrderStatus) {
  return { createdAt, total, status };
}

beforeEach(() => {
  vi.clearAllMocks();
  db.order.count.mockResolvedValue(0);
  db.order.findMany.mockResolvedValue([]);
  db.orderItem.findMany.mockResolvedValue([]);
  db.variant.count.mockResolvedValue(0);
  db.product.count.mockResolvedValue(0);
});

describe("summarizeRevenueWindows", () => {
  it("counts only PAID, PROCESSING, SHIPPED and DELIVERED orders", () => {
    const result = summarizeRevenueWindows(
      [
        order(NOW, 100, "PAID"),
        order(NOW, 200, "PROCESSING"),
        order(NOW, 300, "SHIPPED"),
        order(NOW, 400, "DELIVERED"),
        order(NOW, 500, "PENDING"),
        order(NOW, 600, "CANCELLED"),
        order(NOW, 700, "REFUNDED"),
      ],
      NOW,
    );
    expect(result.today).toBe(1000);
    expect(result.month).toBe(1000);
    expect(result.monthCount).toBe(4);
  });

  it("uses Karachi midnight as the day boundary", () => {
    const beforeMidnight = new Date("2026-11-12T18:59:59.999Z"); // 12 Nov 23:59 PKT
    const atMidnight = new Date("2026-11-12T19:00:00.000Z"); // 13 Nov 00:00 PKT
    const result = summarizeRevenueWindows(
      [order(beforeMidnight, 1000, "PAID"), order(atMidnight, 2000, "PAID")],
      NOW,
    );
    expect(result.today).toBe(2000);
    expect(result.week).toBe(3000);
    expect(result.month).toBe(3000);
  });

  it("includes the exact 7-day and 30-day window starts, excludes one millisecond earlier", () => {
    const weekStart = new Date(DAY_START.getTime() - 6 * 86_400_000);
    const monthStart = new Date(DAY_START.getTime() - 29 * 86_400_000);
    const result = summarizeRevenueWindows(
      [
        order(weekStart, 500, "PAID"),
        order(new Date(weekStart.getTime() - 1), 900, "PAID"),
        order(monthStart, 100, "PAID"),
        order(new Date(monthStart.getTime() - 1), 5000, "PAID"),
      ],
      NOW,
    );
    expect(result.week).toBe(500);
    expect(result.month).toBe(1500);
    expect(result.monthCount).toBe(3);
  });

  it("rounds the 30-day average order value to whole rupees", () => {
    const result = summarizeRevenueWindows(
      [order(NOW, 1000, "PAID"), order(NOW, 1001, "SHIPPED")],
      NOW,
    );
    expect(result.aov30d).toBe(1001);
  });

  it("returns zeroes for an empty shop", () => {
    expect(summarizeRevenueWindows([], NOW)).toEqual({
      today: 0,
      week: 0,
      month: 0,
      monthCount: 0,
      aov30d: 0,
    });
  });
});

describe("Karachi day buckets", () => {
  it("builds 14 consecutive calendar days ending today", () => {
    const range = buildKarachiDayRange(NOW, 14);
    expect(range).toHaveLength(14);
    expect(range[13]?.date).toBe("2026-11-13");
    expect(range[0]?.date).toBe("2026-10-31");
    expect(range[13]?.label).toBe("13 Nov");
  });

  it("buckets instants by Karachi date and ignores out-of-range orders", () => {
    const range = buildKarachiDayRange(NOW, 14);
    const buckets = countOrdersPerDay(
      [
        new Date("2026-11-12T18:59:59.999Z"), // 12 Nov in Karachi
        new Date("2026-11-12T19:00:00.000Z"), // 13 Nov in Karachi
        new Date("2026-11-13T04:00:00.000Z"), // 13 Nov in Karachi
        new Date("2026-01-01T00:00:00.000Z"), // outside the window
      ],
      range,
    );
    expect(buckets[12]?.count).toBe(1);
    expect(buckets[13]?.count).toBe(2);
    expect(buckets.reduce((sum, bucket) => sum + bucket.count, 0)).toBe(3);
  });

  it("returns all-zero buckets for an empty shop", () => {
    const buckets = countOrdersPerDay([], buildKarachiDayRange(NOW, 14));
    expect(buckets).toHaveLength(14);
    expect(buckets.every((bucket) => bucket.count === 0)).toBe(true);
  });
});

describe("topProductsByUnits", () => {
  it("aggregates units per product title, sorts, and caps at five", () => {
    const result = topProductsByUnits([
      { productTitle: "Felt Set", quantity: 2 },
      { productTitle: "Felt Set", quantity: 3 },
      { productTitle: "Painting Kit", quantity: 4 },
      { productTitle: "Gift Box", quantity: 1 },
      { productTitle: "Card Kit", quantity: 1 },
      { productTitle: "Stencil Pack", quantity: 1 },
      { productTitle: "Apron", quantity: 1 },
    ]);
    expect(result).toHaveLength(5);
    expect(result[0]).toEqual({ productTitle: "Felt Set", units: 5 });
    expect(result[1]).toEqual({ productTitle: "Painting Kit", units: 4 });
    // Ties resolve alphabetically so the list is stable.
    expect(result[2]?.productTitle).toBe("Apron");
  });

  it("returns an empty list when nothing sold", () => {
    expect(topProductsByUnits([])).toEqual([]);
  });
});

describe("customerFirstName", () => {
  it("keeps only the first name", () => {
    expect(customerFirstName("Ayesha Khan")).toBe("Ayesha");
    expect(customerFirstName("  Ali  Raza ")).toBe("Ali");
    expect(customerFirstName("Bilal")).toBe("Bilal");
  });
});

describe("buildLaunchChecklist", () => {
  it("reports presence only, driven by config and sample products", () => {
    const withSamples = buildLaunchChecklist(2);
    const byId = new Map(withSamples.map((item) => [item.id, item]));
    expect(byId.get("city")?.done).toBe(true);
    expect(byId.get("whatsapp")?.done).toBe(true);
    expect(byId.get("email")?.done).toBe(false);
    expect(byId.get("instagram")?.done).toBe(false);
    expect(byId.get("facebook")?.done).toBe(false);
    expect(byId.get("easypaisa")?.done).toBe(false);
    // FAQ and legal copy still carry TODO(owner) markers.
    expect(byId.get("content")?.done).toBe(false);
    expect(byId.get("samples")?.done).toBe(false);

    expect(
      buildLaunchChecklist(0).find((item) => item.id === "samples")?.done,
    ).toBe(true);
    // Labels never leak the configured values themselves.
    for (const item of withSamples) {
      expect(item.label).not.toContain("Lahore");
      expect(item.label).not.toContain("923001234567");
    }
  });
});

describe("getAdminDashboard", () => {
  it("returns a calm empty state for an empty database", async () => {
    const dashboard = await getAdminDashboard(NOW);
    expect(dashboard.attention).toEqual({
      pending: 0,
      pendingPaymentReported: 0,
      awaitingShipment: 0,
      lowStock: 0,
      outOfStock: 0,
    });
    expect(dashboard.ordersToday).toBe(0);
    expect(dashboard.orders7d).toBe(0);
    expect(dashboard.revenue.month).toBe(0);
    expect(dashboard.chart).toHaveLength(14);
    expect(dashboard.latestOrders).toEqual([]);
    expect(dashboard.topProducts).toEqual([]);
    expect(dashboard.checklist).toHaveLength(8);
  });

  it("maps counts, revenue, chart and latest orders from selected-field reads", async () => {
    // count calls in order: pending, pending+reported, awaiting, today, 7 days.
    db.order.count
      .mockResolvedValueOnce(5)
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(6)
      .mockResolvedValueOnce(12);
    // variant counts: low stock, then out of stock.
    db.variant.count.mockResolvedValueOnce(4).mockResolvedValueOnce(1);
    db.product.count.mockResolvedValueOnce(2);
    // findMany calls in order: revenue orders, chart orders, latest orders.
    db.order.findMany
      .mockResolvedValueOnce([order(NOW, 1500, "PAID")])
      .mockResolvedValueOnce([{ createdAt: NOW }])
      .mockResolvedValueOnce([
        {
          orderNumber: "AP-2026-0001",
          customerName: "Ayesha Khan",
          total: 1500,
          status: "PAID",
          createdAt: NOW,
        },
      ]);
    db.orderItem.findMany.mockResolvedValueOnce([
      { productTitle: "Felt Set", quantity: 2 },
    ]);

    const dashboard = await getAdminDashboard(NOW);
    expect(dashboard.attention).toEqual({
      pending: 5,
      pendingPaymentReported: 2,
      awaitingShipment: 3,
      lowStock: 4,
      outOfStock: 1,
    });
    expect(dashboard.ordersToday).toBe(6);
    expect(dashboard.orders7d).toBe(12);
    expect(dashboard.revenue.today).toBe(1500);
    expect(dashboard.chart[13]?.count).toBe(1);
    expect(dashboard.latestOrders[0]).toEqual({
      orderNumber: "AP-2026-0001",
      customerFirstName: "Ayesha",
      total: 1500,
      status: "PAID",
      createdAt: NOW,
    });
    expect(dashboard.topProducts).toEqual([
      { productTitle: "Felt Set", units: 2 },
    ]);
  });

  it("queries revenue with the eligible statuses and never selects private fields", async () => {
    await getAdminDashboard(NOW);

    const revenueCall = db.order.findMany.mock.calls[0]?.[0];
    expect(revenueCall.where.status).toEqual({ in: REVENUE_STATUSES });
    expect(revenueCall.select).toEqual({
      createdAt: true,
      total: true,
      status: true,
    });

    const latestCall = db.order.findMany.mock.calls[2]?.[0];
    expect(latestCall.take).toBe(8);
    expect(latestCall.select).toEqual({
      orderNumber: true,
      customerName: true,
      total: true,
      status: true,
      createdAt: true,
    });
    expect(JSON.stringify(latestCall.select)).not.toMatch(
      /phone|email|address|token|hash|payment/i,
    );

    const itemsCall = db.orderItem.findMany.mock.calls[0]?.[0];
    expect(itemsCall.where.order.status).toEqual({ in: REVENUE_STATUSES });
    expect(itemsCall.select).toEqual({ productTitle: true, quantity: true });

    const reportedCall = db.order.count.mock.calls[1]?.[0];
    expect(reportedCall.where).toEqual({
      status: "PENDING",
      paymentReportedAt: { not: null },
    });
  });
});
