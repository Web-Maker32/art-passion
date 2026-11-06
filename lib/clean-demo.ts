/**
 * Pure logic for `pnpm db:clean-demo`, kept separate from the database script
 * so the safety rules can be tested without a database.
 */

export const DEMO_TITLE_PREFIX = "Sample: ";

export type DemoProductCandidate = {
  id: string;
  title: string;
  status: "DRAFT" | "PUBLISHED" | "HIDDEN";
  variantIds: string[];
};

export type DemoCleanupPlan = {
  /** Never ordered: safe to delete with their variants and images. */
  toDelete: DemoProductCandidate[];
  /** Appear in at least one order: hide them instead of deleting. */
  toArchive: DemoProductCandidate[];
};

export function isDemoProductTitle(title: string): boolean {
  return title.startsWith(DEMO_TITLE_PREFIX);
}

/**
 * Splits sample products into deletable and archivable groups. A product is
 * protected as soon as any of its variants appears in an order, because order
 * lines keep a reference to the variant.
 */
export function planDemoCleanup(
  products: ReadonlyArray<DemoProductCandidate>,
  orderedVariantIds: ReadonlySet<string>,
): DemoCleanupPlan {
  const toDelete: DemoProductCandidate[] = [];
  const toArchive: DemoProductCandidate[] = [];

  for (const product of products) {
    const appearsInOrder = product.variantIds.some((variantId) =>
      orderedVariantIds.has(variantId),
    );
    if (appearsInOrder) {
      toArchive.push(product);
    } else {
      toDelete.push(product);
    }
  }

  return { toDelete, toArchive };
}
