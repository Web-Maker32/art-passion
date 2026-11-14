import { describe, expect, it } from "vitest";
import {
  avatarTintClass,
  customerInitials,
  formatRelativeTime,
  getStockDisplay,
  orderProgressStep,
} from "@/lib/admin-display";

// 13 Nov 2026, 10:00 in Karachi (UTC+05:00).
const NOW = new Date("2026-11-13T05:00:00.000Z");

function ago(ms: number): Date {
  return new Date(NOW.getTime() - ms);
}

describe("formatRelativeTime", () => {
  it("shows 'just now' under a minute (and for future instants)", () => {
    expect(formatRelativeTime(ago(30_000), NOW)).toBe("just now");
    expect(formatRelativeTime(ago(0), NOW)).toBe("just now");
    expect(formatRelativeTime(new Date(NOW.getTime() + 60_000), NOW)).toBe(
      "just now",
    );
  });

  it("shows whole minutes under an hour", () => {
    expect(formatRelativeTime(ago(60_000), NOW)).toBe("1m ago");
    expect(formatRelativeTime(ago(5 * 60_000), NOW)).toBe("5m ago");
    expect(formatRelativeTime(ago(59 * 60_000 + 59_000), NOW)).toBe("59m ago");
  });

  it("shows whole hours under a day", () => {
    expect(formatRelativeTime(ago(60 * 60_000), NOW)).toBe("1h ago");
    expect(formatRelativeTime(ago(3 * 60 * 60_000), NOW)).toBe("3h ago");
    expect(formatRelativeTime(ago(23 * 60 * 60_000), NOW)).toBe("23h ago");
  });

  it("shows whole days under a week", () => {
    expect(formatRelativeTime(ago(24 * 60 * 60_000), NOW)).toBe("1d ago");
    expect(formatRelativeTime(ago(2 * 24 * 60 * 60_000), NOW)).toBe("2d ago");
    expect(formatRelativeTime(ago(6 * 24 * 60 * 60_000), NOW)).toBe("6d ago");
  });

  it("falls back to the Karachi date from a week old", () => {
    expect(formatRelativeTime(ago(7 * 24 * 60 * 60_000), NOW)).toBe(
      "06 Nov 2026",
    );
    expect(formatRelativeTime(ago(40 * 24 * 60 * 60_000), NOW)).toBe(
      "04 Oct 2026",
    );
  });
});

describe("customerInitials", () => {
  it("uses the first and last word for multi-word names", () => {
    expect(customerInitials("Ayesha Khan")).toBe("AK");
    expect(customerInitials("Ali Raza Butt")).toBe("AB");
  });

  it("uses the first two letters for a single word", () => {
    expect(customerInitials("Bilal")).toBe("BI");
    expect(customerInitials("A")).toBe("A");
  });

  it("trims, collapses whitespace and upper-cases", () => {
    expect(customerInitials("  ayesha   khan ")).toBe("AK");
    expect(customerInitials("ayesha")).toBe("AY");
  });

  it("returns '?' for empty or whitespace-only names", () => {
    expect(customerInitials("")).toBe("?");
    expect(customerInitials("   ")).toBe("?");
  });

  it("is code-point safe for astral characters", () => {
    // The leading emoji is a surrogate pair; it must stay whole, not split.
    expect(customerInitials("\u{1F31F} Star")).toBe("\u{1F31F}S");
    expect(customerInitials("\u{1F31F}")).toBe("\u{1F31F}");
  });
});

describe("avatarTintClass", () => {
  it("is stable for the same name", () => {
    expect(avatarTintClass("Ayesha Khan")).toBe(avatarTintClass("Ayesha Khan"));
  });

  it("always returns a tinted background and a text colour", () => {
    for (const name of ["Ayesha Khan", "Bilal", "", "Ali Raza Butt", "Z"]) {
      const tint = avatarTintClass(name);
      expect(tint).toMatch(/bg-/);
      expect(tint).toMatch(/text-/);
    }
  });

  it("spreads different names across more than one tint", () => {
    const tints = new Set(
      ["Ayesha Khan", "Bilal", "Ali Raza", "Sara", "Usman", "Zara"].map(
        avatarTintClass,
      ),
    );
    expect(tints.size).toBeGreaterThan(1);
  });
});

describe("getStockDisplay", () => {
  it("labels made-to-order products regardless of stock", () => {
    expect(getStockDisplay({ madeToOrder: true, totalStock: 0 })).toEqual({
      label: "Made to order",
      tone: "madeToOrder",
    });
    expect(getStockDisplay({ madeToOrder: true, totalStock: 9 })).toEqual({
      label: "Made to order",
      tone: "madeToOrder",
    });
  });

  it("labels zero stock as out of stock", () => {
    expect(getStockDisplay({ madeToOrder: false, totalStock: 0 })).toEqual({
      label: "Out of stock",
      tone: "out",
    });
  });

  it("labels 1-2 units as low", () => {
    expect(getStockDisplay({ madeToOrder: false, totalStock: 1 })).toEqual({
      label: "1 low",
      tone: "low",
    });
    expect(getStockDisplay({ madeToOrder: false, totalStock: 2 })).toEqual({
      label: "2 low",
      tone: "low",
    });
  });

  it("labels 3+ units as in stock", () => {
    expect(getStockDisplay({ madeToOrder: false, totalStock: 3 })).toEqual({
      label: "3 in stock",
      tone: "fine",
    });
    expect(getStockDisplay({ madeToOrder: false, totalStock: 120 })).toEqual({
      label: "120 in stock",
      tone: "fine",
    });
  });
});

describe("orderProgressStep", () => {
  it("maps live statuses to a 0-4 step", () => {
    expect(orderProgressStep("PENDING")).toBe(0);
    expect(orderProgressStep("PAID")).toBe(1);
    expect(orderProgressStep("PROCESSING")).toBe(2);
    expect(orderProgressStep("SHIPPED")).toBe(3);
    expect(orderProgressStep("DELIVERED")).toBe(4);
  });

  it("returns null for cancelled and refunded orders", () => {
    expect(orderProgressStep("CANCELLED")).toBeNull();
    expect(orderProgressStep("REFUNDED")).toBeNull();
  });
});