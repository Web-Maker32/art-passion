import { describe, expect, it } from "vitest";
import {
  allowedNextStatuses,
  canTransitionOrderStatus,
} from "@/lib/admin-order-status";

describe("order status transitions", () => {
  it("allows PENDING -> PAID", () => {
    expect(canTransitionOrderStatus("PENDING", "PAID")).toBe(true);
  });

  it("allows PENDING -> CANCELLED", () => {
    expect(canTransitionOrderStatus("PENDING", "CANCELLED")).toBe(true);
  });

  it("allows PAID -> PROCESSING", () => {
    expect(canTransitionOrderStatus("PAID", "PROCESSING")).toBe(true);
  });

  it("allows PAID -> CANCELLED", () => {
    expect(canTransitionOrderStatus("PAID", "CANCELLED")).toBe(true);
  });

  it("allows PROCESSING -> SHIPPED", () => {
    expect(canTransitionOrderStatus("PROCESSING", "SHIPPED")).toBe(true);
  });

  it("allows PROCESSING -> CANCELLED", () => {
    expect(canTransitionOrderStatus("PROCESSING", "CANCELLED")).toBe(true);
  });

  it("rejects PAID -> SHIPPED (must go through PROCESSING)", () => {
    expect(canTransitionOrderStatus("PAID", "SHIPPED")).toBe(false);
  });

  it("rejects PAID -> DELIVERED", () => {
    expect(canTransitionOrderStatus("PAID", "DELIVERED")).toBe(false);
  });

  it("rejects PROCESSING -> DELIVERED (must ship first)", () => {
    expect(canTransitionOrderStatus("PROCESSING", "DELIVERED")).toBe(false);
  });

  it("rejects PROCESSING -> PAID (no going back)", () => {
    expect(canTransitionOrderStatus("PROCESSING", "PAID")).toBe(false);
  });

  it("rejects SHIPPED -> PROCESSING (no going back)", () => {
    expect(canTransitionOrderStatus("SHIPPED", "PROCESSING")).toBe(false);
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
    expect(canTransitionOrderStatus("DELIVERED", "PROCESSING")).toBe(false);
    expect(canTransitionOrderStatus("DELIVERED", "SHIPPED")).toBe(false);
    expect(canTransitionOrderStatus("DELIVERED", "CANCELLED")).toBe(false);
  });

  it("rejects CANCELLED -> any transition", () => {
    expect(canTransitionOrderStatus("CANCELLED", "PENDING")).toBe(false);
    expect(canTransitionOrderStatus("CANCELLED", "PAID")).toBe(false);
    expect(canTransitionOrderStatus("CANCELLED", "PROCESSING")).toBe(false);
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
    expect(canTransitionOrderStatus("PROCESSING", "PROCESSING")).toBe(false);
  });
});

describe("allowedNextStatuses", () => {
  it("lists only the allowed next steps per status", () => {
    expect(allowedNextStatuses("PENDING")).toEqual(["PAID", "CANCELLED"]);
    expect(allowedNextStatuses("PAID")).toEqual(["PROCESSING", "CANCELLED"]);
    expect(allowedNextStatuses("PROCESSING")).toEqual(["SHIPPED", "CANCELLED"]);
    expect(allowedNextStatuses("SHIPPED")).toEqual(["DELIVERED"]);
    expect(allowedNextStatuses("DELIVERED")).toEqual([]);
    expect(allowedNextStatuses("CANCELLED")).toEqual([]);
    expect(allowedNextStatuses("REFUNDED")).toEqual([]);
  });
});
