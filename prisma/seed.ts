import dotenv from "dotenv";
import { PrismaNeon } from "@prisma/adapter-neon";
import bcrypt from "bcryptjs";
import { PrismaClient, type ProductType } from "../generated/prisma/client";
import { storeCategories } from "../lib/catalog";

dotenv.config({ path: [".env.local", ".env"] });

type SeedProduct = {
  slug: string;
  title: string;
  shortDescription: string;
  description: string;
  whatsIncluded: string[];
  type: ProductType;
  categorySlug: string;
  materials: string[];
  tags: string[];
  size?: string;
  recommendedAge?: string;
  safetyNote?: string;
  madeToOrder: boolean;
  leadTimeDays: number;
  variants: Array<{ sku: string; label: string; price: number; stock: number }>;
};

/**
 * Sample products only. Every title starts with "Sample: " so the
 * `pnpm db:clean-demo` script can find and remove them safely before the shop
 * opens. Replace these with the owner's real products.
 */
const products: SeedProduct[] = [
  {
    slug: "sample-woodland-friends-felt-play-set",
    title: "Sample: Woodland Friends Felt Play Set",
    shortDescription:
      "A hand-stitched woodland family for quiet, screen-free storytelling.",
    description:
      "A soft felt play set with a fox, owl, hedgehog and two mushrooms, cut and stitched by hand. The pieces are large enough for small hands and come with a cotton bag for tidy storage. Colours and stitching vary slightly from set to set because each one is made individually.",
    whatsIncluded: [
      "Five hand-stitched felt pieces",
      "Cotton storage bag",
      "Care and play idea card",
    ],
    type: "FELT_SET",
    categorySlug: "felt-sets",
    materials: ["Wool-blend felt", "Cotton thread", "Polyester filling"],
    tags: ["animals", "pretend play", "felt"],
    size: "Largest piece approx. 12 cm tall",
    recommendedAge: "3 years and up",
    safetyNote:
      "Contains small parts. Adult supervision recommended for children under three.",
    madeToOrder: true,
    leadTimeDays: 7,
    variants: [
      { sku: "SAMPLE-FELT-WOOD-SM", label: "Small set", price: 3200, stock: 8 },
      { sku: "SAMPLE-FELT-WOOD-LG", label: "Large set", price: 4500, stock: 4 },
    ],
  },
  {
    slug: "sample-farmyard-felt-play-set",
    title: "Sample: Farmyard Felt Play Set",
    shortDescription: "Soft felt farm animals for storytelling and pretend play.",
    description:
      "A collection of hand-stitched farm animals with simple, friendly shapes. The set is designed for open-ended play: name the animals, build a little farm, or pack them away in the matching bag. Each animal is cut and stitched by hand.",
    whatsIncluded: [
      "Six hand-stitched animals",
      "Cotton storage bag",
      "Play idea card",
    ],
    type: "FELT_SET",
    categorySlug: "felt-sets",
    materials: ["Wool-blend felt", "Cotton thread", "Polyester filling"],
    tags: ["farm", "animals", "felt"],
    size: "Animals approx. 8-10 cm tall",
    recommendedAge: "3 years and up",
    safetyNote: "Contains small parts. Adult supervision recommended.",
    madeToOrder: false,
    leadTimeDays: 0,
    variants: [
      { sku: "SAMPLE-FELT-FARM-6", label: "6 animals", price: 2900, stock: 10 },
      {
        sku: "SAMPLE-FELT-FARM-10",
        label: "10 animals",
        price: 4200,
        stock: 0,
      },
    ],
  },
  {
    slug: "sample-rainbow-coloring-kit",
    title: "Sample: Rainbow Coloring Kit",
    shortDescription: "A cheerful coloring kit with pencils and activity sheets.",
    description:
      "A ready-to-use coloring kit for quiet afternoons. The kit is assembled by hand and checked piece by piece, with a small selection of pencils, sharpener and printed activity sheets. Pages are printed on thicker paper so felt-tip pens do not bleed through easily.",
    whatsIncluded: [
      "12 colored pencils",
      "Pencil sharpener",
      "20 printed activity sheets",
      "Cotton pouch",
    ],
    type: "KIT",
    categorySlug: "coloring-kits",
    materials: ["Colored pencils", "Printed paper", "Cotton pouch"],
    tags: ["coloring", "rainbow", "kids"],
    size: "A5 activity sheets",
    recommendedAge: "4 years and up",
    safetyNote: "Small parts. Adult supervision recommended for young children.",
    madeToOrder: false,
    leadTimeDays: 0,
    variants: [
      {
        sku: "SAMPLE-KIT-RAINBOW",
        label: "Complete kit",
        price: 1600,
        stock: 20,
      },
    ],
  },
  {
    slug: "sample-little-garden-painting-kit",
    title: "Sample: Little Garden Painting Kit",
    shortDescription:
      "A small painting kit with garden-inspired ideas and supplies.",
    description:
      "A compact painting kit for beginners. It includes a small palette, two brushes, watercolor paper and a card of simple garden prompts to get started. Everything is packed by hand and can be refilled when the paper runs out.",
    whatsIncluded: [
      "12-color watercolor palette",
      "Two brushes",
      "12 sheets of watercolor paper",
      "Garden prompt card",
    ],
    type: "KIT",
    categorySlug: "painting-kits",
    materials: ["Watercolor paints", "Paper", "Wooden brushes"],
    tags: ["painting", "nature", "beginner"],
    size: "Palette 12 cm × 8 cm",
    recommendedAge: "6 years and up",
    safetyNote: "Non-toxic paints. Adult supervision recommended.",
    madeToOrder: false,
    leadTimeDays: 0,
    variants: [
      {
        sku: "SAMPLE-KIT-GARDEN",
        label: "Complete kit",
        price: 2200,
        stock: 12,
      },
      {
        sku: "SAMPLE-KIT-GARDEN-REFILL",
        label: "Refill pack",
        price: 900,
        stock: 18,
      },
    ],
  },
  {
    slug: "sample-creative-afternoon-gift-set",
    title: "Sample: Creative Afternoon Gift Set",
    shortDescription: "A ready-to-give bundle for a quiet afternoon of making.",
    description:
      "A small gift set packed for giving: a mini painting kit, a hand-stitched felt bookmark and a note card. The pieces are wrapped together and can be sent directly to the recipient with a gift note added at checkout.",
    whatsIncluded: [
      "Mini painting kit",
      "Hand-stitched felt bookmark",
      "Blank note card and envelope",
      "Gift box",
    ],
    type: "GIFT_SET",
    categorySlug: "gift-sets",
    materials: ["Watercolor paints", "Paper", "Wool-blend felt"],
    tags: ["gift", "creative", "handmade"],
    size: "Gift box approx. 20 cm × 15 cm",
    recommendedAge: "6 years and up",
    safetyNote: "Contains small parts. Adult supervision recommended.",
    madeToOrder: true,
    leadTimeDays: 5,
    variants: [
      { sku: "SAMPLE-GIFT-CREATIVE", label: "One set", price: 3500, stock: 6 },
      { sku: "SAMPLE-GIFT-CREATIVE-2", label: "Two sets", price: 6500, stock: 3 },
    ],
  },
];

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD;
  const connectionString = process.env.DATABASE_URL;

  if (!email || !password) {
    throw new Error("SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD must be set before seeding.");
  }

  if (!connectionString) {
    throw new Error("DATABASE_URL must be set before seeding.");
  }

  const prisma = new PrismaClient({
    adapter: new PrismaNeon({ connectionString }),
  });

  try {
    const passwordHash = await bcrypt.hash(password, 12);

    await prisma.user.upsert({
      where: { email },
      create: {
        email,
        passwordHash,
        name: "Art Passion Admin",
        role: "ADMIN",
      },
      update: {
        passwordHash,
        name: "Art Passion Admin",
        role: "ADMIN",
      },
    });

    for (const category of storeCategories) {
      await prisma.category.upsert({
        where: { slug: category.slug },
        create: { name: category.name, slug: category.slug },
        update: { name: category.name },
      });
    }

    for (const product of products) {
      const { variants, categorySlug, ...productData } = product;
      const imageUrl = `https://placehold.co/800x800.png?text=${encodeURIComponent(product.title)}`;
      const savedProduct = await prisma.product.upsert({
        where: { slug: product.slug },
        create: {
          ...productData,
          category: { connect: { slug: categorySlug } },
          status: "PUBLISHED",
          images: {
            create: {
              url: imageUrl,
              alt: product.title,
              position: 0,
            },
          },
        },
        update: {
          ...productData,
          category: { connect: { slug: categorySlug } },
          status: "PUBLISHED",
        },
      });

      const updatedImages = await prisma.productImage.updateMany({
        where: { productId: savedProduct.id, position: 0 },
        data: { url: imageUrl, alt: product.title },
      });

      if (updatedImages.count === 0) {
        await prisma.productImage.create({
          data: {
            productId: savedProduct.id,
            url: imageUrl,
            alt: product.title,
            position: 0,
          },
        });
      }

      for (const variant of variants) {
        await prisma.variant.upsert({
          where: { sku: variant.sku },
          create: { ...variant, productId: savedProduct.id },
          update: { ...variant, productId: savedProduct.id },
        });
      }
    }

    console.info(
      `Seeded ${storeCategories.length} categories, ${products.length} sample products, and the admin user.`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error("Database seeding failed.", error);
  process.exitCode = 1;
});
