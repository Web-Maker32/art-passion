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
  /** 150-160 character description used for the category page metadata. */
  metaDescription: string;
};

export const storeCategories: StoreCategoryDefinition[] = [
  {
    name: "Felt Play Sets",
    slug: "felt-sets",
    description: "Hand-stitched felt friends for imaginative, screen-free play.",
    metaDescription:
      "Soft felt play sets with hand-stitched animals and quiet details, made one at a time in Pakistan for imaginative, screen-free play at home or on the go.",
  },
  {
    name: "Coloring Kits",
    slug: "coloring-kits",
    description: "Thoughtful coloring kits for little creators.",
    metaDescription:
      "Coloring kits for little creators, assembled by hand in Pakistan with crayons, printed pages and everything a little creator needs to start coloring right away.",
  },
  {
    name: "Painting Kits",
    slug: "painting-kits",
    description: "Simple painting kits with everything needed to begin.",
    metaDescription:
      "Painting kits with paints, brushes and paper, packed by hand in Pakistan so children and beginners can start creating at home straight out of the box.",
  },
  {
    name: "Gift Sets",
    slug: "gift-sets",
    description: "Handmade gifts made to bring a little joy to someone special.",
    metaDescription:
      "Handmade gift sets from Art Passion, hand-chosen and packed in Pakistan for birthdays, thank-yous and small celebrations that deserve something personal.",
  },
];

export const categoryDescriptions = Object.fromEntries(
  storeCategories.map(({ slug, description }) => [slug, description]),
) as Record<string, string>;

export const categoryMetaDescriptions = Object.fromEntries(
  storeCategories.map(({ slug, metaDescription }) => [slug, metaDescription]),
) as Record<string, string>;
