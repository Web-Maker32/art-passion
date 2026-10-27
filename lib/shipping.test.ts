import { describe, expect, it } from "vitest";
import { calculateShippingFee } from "@/lib/shipping";

describe("calculateShippingFee", () => {
  it("charges Rs 350 below the free delivery threshold", () => {
    expect(calculateShippingFee(4999)).toBe(350);
  });

  it("waives delivery at exactly Rs 5,000", () => {
    expect(calculateShippingFee(5000)).toBe(0);
  });

  it("charges nothing for an empty cart", () => {
    expect(calculateShippingFee(0)).toBe(0);
  });

  it("rejects negative or fractional subtotals", () => {
    expect(() => calculateShippingFee(-1)).toThrow(RangeError);
    expect(() => calculateShippingFee(12.5)).toThrow(RangeError);
  });
});
