import { describe, expect, it } from "vitest";
import {
  DEMO_TITLE_PREFIX,
  isDemoProductTitle,
  planDemoCleanup,
  type DemoProductCandidate,
} from "@/lib/clean-demo";

const products: DemoProductCandidate[] = [
  {
    id: "product-felt",
    title: "Sample: Felt Play Set",
    status: "PUBLISHED",
    variantIds: ["variant-felt-small", "variant-felt-large"],
  },
  {
    id: "product-kit",
    title: "Sample: Coloring Kit",
    status: "PUBLISHED",
    variantIds: ["variant-kit"],
  },
  {
    id: "product-archived",
    title: "Sample: Old Gift Set",
    status: "HIDDEN",
    variantIds: ["variant-archived"],
  },
];

describe("planDemoCleanup", () => {
  it("deletes sample products that were never ordered", () => {
    const plan = planDemoCleanup(products, new Set());

    expect(plan.toDelete.map((product) => product.id)).toEqual([
      "product-felt",
      "product-kit",
      "product-archived",
    ]);
    expect(plan.toArchive).toEqual([]);
  });

  it("never deletes a product that appears in an order", () => {
    const plan = planDemoCleanup(products, new Set(["variant-kit"]));

    expect(plan.toDelete.map((product) => product.id)).toEqual([
      "product-felt",
      "product-archived",
    ]);
    expect(plan.toArchive.map((product) => product.id)).toEqual([
      "product-kit",
    ]);
  });

  it("protects a product when any one of its variants was ordered", () => {
    const plan = planDemoCleanup(products, new Set(["variant-felt-large"]));

    expect(plan.toDelete.map((product) => product.id)).not.toContain(
      "product-felt",
    );
    expect(plan.toArchive.map((product) => product.id)).toContain(
      "product-felt",
    );
  });

  it("keeps every product in exactly one group", () => {
    const plan = planDemoCleanup(products, new Set(["variant-archived"]));

    expect(plan.toDelete.length + plan.toArchive.length).toBe(products.length);
    expect(
      plan.toDelete.some((product) =>
        plan.toArchive.some((archived) => archived.id === product.id),
      ),
    ).toBe(false);
  });
});

describe("isDemoProductTitle", () => {
  it("matches the exact sample prefix used by the seed", () => {
    expect(DEMO_TITLE_PREFIX).toBe("Sample: ");
    expect(isDemoProductTitle("Sample: Woodland Felt Set")).toBe(true);
    expect(isDemoProductTitle("sample: Woodland Felt Set")).toBe(false);
    expect(isDemoProductTitle("Woodland Felt Set")).toBe(false);
    expect(isDemoProductTitle("My Sample Set")).toBe(false);
  });
});
