import { describe, expect, it } from "vitest";
import { calculateShippingFee } from "@/lib/shipping";
import {
  deliveryInfoLine,
  isOwnerTodo,
  siteConfig,
} from "@/lib/site-config";

describe("siteConfig delivery values", () => {
  it("keeps the agreed flat fee and free-delivery threshold", () => {
    expect(siteConfig.deliveryFee).toBe(350);
    expect(siteConfig.freeDeliveryThreshold).toBe(5000);
  });

  it("charges the configured fee one rupee below the threshold", () => {
    expect(calculateShippingFee(siteConfig.freeDeliveryThreshold - 1)).toBe(
      siteConfig.deliveryFee,
    );
  });

  it("waives delivery at the configured threshold", () => {
    expect(calculateShippingFee(siteConfig.freeDeliveryThreshold)).toBe(0);
  });

  it("builds the delivery line from the same values", () => {
    expect(deliveryInfoLine).toBe(
      `Flat Rs ${siteConfig.deliveryFee} delivery, free over Rs ${siteConfig.freeDeliveryThreshold}`,
    );
    expect(isOwnerTodo(deliveryInfoLine)).toBe(false);
  });
});

describe("siteConfig owner placeholders", () => {
  it("recognises the TODO(owner) marker", () => {
    expect(isOwnerTodo("TODO(owner): add the phone number")).toBe(true);
    expect(isOwnerTodo("Art Passion")).toBe(false);
  });

  it("leaves a non-empty value for every owner-supplied field", () => {
    const ownerSupplied = [
      siteConfig.whatsappNumber,
      siteConfig.contactEmail,
      siteConfig.instagramUrl,
      siteConfig.facebookUrl,
      siteConfig.city,
      siteConfig.easypaisaAccountName,
      siteConfig.easypaisaNumber,
    ];

    for (const value of ownerSupplied) {
      expect(value.trim().length).toBeGreaterThan(0);
    }
  });
});
