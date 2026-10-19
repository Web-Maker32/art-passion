import { describe, expect, it } from "vitest";
import { formatPrice } from "@/lib/format";

describe("formatPrice", () => {
  it("converts paisa to a formatted PKR amount", () => {
    expect(formatPrice(123456)).toContain("1,234.56");
    expect(formatPrice(123456)).toContain("Rs");
  });

  it("formats whole-rupee amounts without unnecessary decimal places", () => {
    expect(formatPrice(250000)).toContain("2,500");
    expect(formatPrice(250000)).not.toContain(".00");
  });
});
