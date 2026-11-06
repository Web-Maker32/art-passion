/**
 * Canonical catalogue categories. Imported by the seed script, the footer and
 * the search empty state so names and slugs stay consistent. The database
 * remains the source of truth for products; this list only describes the
 * intended top-level collections.
 */

export type StoreCategoryDefinition = {
  name: string;
  slug: string;
  description: string;
};

export const storeCategories: StoreCategoryDefinition[] = [
  {
    name: "Felt Play Sets",
    slug: "felt-sets",
    description: "Hand-stitched felt friends for imaginative, screen-free play.",
  },
  {
    name: "Coloring Kits",
    slug: "coloring-kits",
    description: "Thoughtful coloring kits for little creators.",
  },
  {
    name: "Painting Kits",
    slug: "painting-kits",
    description: "Simple painting kits with everything needed to begin.",
  },
  {
    name: "Gift Sets",
    slug: "gift-sets",
    description: "Handmade gifts made to bring a little joy to someone special.",
  },
];

export const categoryDescriptions = Object.fromEntries(
  storeCategories.map(({ slug, description }) => [slug, description]),
) as Record<string, string>;
