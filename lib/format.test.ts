import { describe, expect, it } from "vitest";
import { formatPrice } from "@/lib/format";

describe("formatPrice", () => {
  it("formats whole rupees as PKR with thousands separators", () => {
    expect(formatPrice(123456)).toContain("123,456");
    expect(formatPrice(123456)).toContain("Rs");
    expect(formatPrice(123456)).not.toContain(".");
  });

  it("does not divide rupee amounts or add decimal places", () => {
    expect(formatPrice(1800)).toContain("1,800");
    expect(formatPrice(1800)).not.toContain(".00");
  });
});
