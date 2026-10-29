import { describe, expect, it } from "vitest";
import { canTransitionOrderStatus } from "@/lib/admin-order-status";

describe("order status transitions", () => {
  it("allows PENDING -> PAID", () => {
    expect(canTransitionOrderStatus("PENDING", "PAID")).toBe(true);
  });

  it("allows PENDING -> CANCELLED", () => {
    expect(canTransitionOrderStatus("PENDING", "CANCELLED")).toBe(true);
  });

  it("allows PAID -> SHIPPED", () => {
    expect(canTransitionOrderStatus("PAID", "SHIPPED")).toBe(true);
  });

  it("allows PAID -> CANCELLED", () => {
    expect(canTransitionOrderStatus("PAID", "CANCELLED")).toBe(true);
  });

  it("allows SHIPPED -> DELIVERED", () => {
    expect(canTransitionOrderStatus("SHIPPED", "DELIVERED")).toBe(true);
  });

  it("rejects PENDING -> SHIPPED (must go through PAID)", () => {
    expect(canTransitionOrderStatus("PENDING", "SHIPPED")).toBe(false);
  });

  it("rejects PENDING -> DELIVERED", () => {
    expect(canTransitionOrderStatus("PENDING", "DELIVERED")).toBe(false);
  });

  it("rejects PAID -> PENDING (no going back)", () => {
    expect(canTransitionOrderStatus("PAID", "PENDING")).toBe(false);
  });

  it("rejects SHIPPED -> CANCELLED (too late to cancel)", () => {
    expect(canTransitionOrderStatus("SHIPPED", "CANCELLED")).toBe(false);
  });

  it("rejects DELIVERED -> any transition", () => {
    expect(canTransitionOrderStatus("DELIVERED", "PENDING")).toBe(false);
    expect(canTransitionOrderStatus("DELIVERED", "PAID")).toBe(false);
    expect(canTransitionOrderStatus("DELIVERED", "SHIPPED")).toBe(false);
    expect(canTransitionOrderStatus("DELIVERED", "CANCELLED")).toBe(false);
  });

  it("rejects CANCELLED -> any transition", () => {
    expect(canTransitionOrderStatus("CANCELLED", "PENDING")).toBe(false);
    expect(canTransitionOrderStatus("CANCELLED", "PAID")).toBe(false);
    expect(canTransitionOrderStatus("CANCELLED", "SHIPPED")).toBe(false);
    expect(canTransitionOrderStatus("CANCELLED", "DELIVERED")).toBe(false);
  });

  it("rejects REFUNDED -> any transition", () => {
    expect(canTransitionOrderStatus("REFUNDED", "PENDING")).toBe(false);
    expect(canTransitionOrderStatus("REFUNDED", "PAID")).toBe(false);
  });

  it("rejects same-status transition", () => {
    expect(canTransitionOrderStatus("PENDING", "PENDING")).toBe(false);
    expect(canTransitionOrderStatus("PAID", "PAID")).toBe(false);
  });
});
