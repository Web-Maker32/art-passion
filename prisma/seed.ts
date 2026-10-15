import dotenv from "dotenv";
import { PrismaNeon } from "@prisma/adapter-neon";
import bcrypt from "bcryptjs";
import { PrismaClient, type ProductType } from "../generated/prisma/client";

dotenv.config({ path: [".env.local", ".env"] });

type SeedProduct = {
  slug: string;
  title: string;
  description: string;
  type: ProductType;
  categorySlug: string;
  materials: string[];
  tags: string[];
  madeToOrder: boolean;
  leadTimeDays: number;
  variants: Array<{ sku: string; label: string; price: number; stock: number }>;
};

const categories = [
  { name: "Felt Sets", slug: "felt-sets" },
  { name: "Coloring Kits", slug: "coloring-kits" },
  { name: "Gift Sets", slug: "gift-sets" },
];

const products: SeedProduct[] = [
  {
    slug: "woodland-friends-felt-set",
    title: "Woodland Friends Felt Set",
    description: "A handmade felt play set featuring friendly woodland animals.",
    type: "FELT_SET",
    categorySlug: "felt-sets",
    materials: ["Wool felt", "Cotton thread"],
    tags: ["animals", "pretend play"],
    madeToOrder: true,
    leadTimeDays: 7,
    variants: [
      { sku: "AP-FELT-WOOD-SM", label: "Small set", price: 240000, stock: 12 },
      { sku: "AP-FELT-WOOD-LG", label: "Large set", price: 360000, stock: 8 },
    ],
  },
  {
    slug: "farmyard-felt-play-set",
    title: "Farmyard Felt Play Set",
    description: "Soft felt farm animals for storytelling and imaginative play.",
    type: "FELT_SET",
    categorySlug: "felt-sets",
    materials: ["Wool felt", "Cotton thread"],
    tags: ["farm", "animals"],
    madeToOrder: true,
    leadTimeDays: 8,
    variants: [
      { sku: "AP-FELT-FARM-6", label: "6 animals", price: 290000, stock: 10 },
      { sku: "AP-FELT-FARM-10", label: "10 animals", price: 420000, stock: 6 },
    ],
  },
  {
    slug: "ocean-pals-felt-set",
    title: "Ocean Pals Felt Set",
    description: "A colorful undersea collection of hand-stitched felt friends.",
    type: "FELT_SET",
    categorySlug: "felt-sets",
    materials: ["Wool felt", "Cotton thread"],
    tags: ["ocean", "animals"],
    madeToOrder: false,
    leadTimeDays: 0,
    variants: [{ sku: "AP-FELT-OCEAN-SET", label: "Complete set", price: 320000, stock: 14 }],
  },
  {
    slug: "felt-fruit-market-set",
    title: "Felt Fruit Market Set",
    description: "Pretend-play fruit pieces, stitched by hand from soft felt.",
    type: "FELT_SET",
    categorySlug: "felt-sets",
    materials: ["Wool felt", "Cotton thread"],
    tags: ["food", "pretend play"],
    madeToOrder: true,
    leadTimeDays: 6,
    variants: [
      { sku: "AP-FELT-FRUIT-8", label: "8 pieces", price: 210000, stock: 18 },
      { sku: "AP-FELT-FRUIT-12", label: "12 pieces", price: 300000, stock: 9 },
    ],
  },
  {
    slug: "watercolor-starter-kit",
    title: "Watercolor Starter Kit",
    description: "A beginner-friendly kit for little watercolor explorations.",
    type: "KIT",
    categorySlug: "coloring-kits",
    materials: ["Watercolor paints", "Paper", "Brush"],
    tags: ["painting", "beginner"],
    madeToOrder: false,
    leadTimeDays: 0,
    variants: [
      { sku: "AP-KIT-WATER-SM", label: "Mini kit", price: 180000, stock: 20 },
      { sku: "AP-KIT-WATER-LG", label: "Full kit", price: 280000, stock: 15 },
    ],
  },
  {
    slug: "rainbow-coloring-kit",
    title: "Rainbow Coloring Kit",
    description: "A cheerful coloring set with reusable activity sheets.",
    type: "KIT",
    categorySlug: "coloring-kits",
    materials: ["Activity sheets", "Colored pencils"],
    tags: ["coloring", "rainbow"],
    madeToOrder: false,
    leadTimeDays: 0,
    variants: [{ sku: "AP-KIT-RAINBOW-SET", label: "Complete kit", price: 160000, stock: 22 }],
  },
  {
    slug: "little-garden-painting-kit",
    title: "Little Garden Painting Kit",
    description: "A small painting kit with garden-inspired prompts and supplies.",
    type: "KIT",
    categorySlug: "coloring-kits",
    materials: ["Watercolor paints", "Paper", "Brush"],
    tags: ["painting", "nature"],
    madeToOrder: false,
    leadTimeDays: 0,
    variants: [
      { sku: "AP-KIT-GARDEN-SET", label: "Complete kit", price: 220000, stock: 11 },
      { sku: "AP-KIT-GARDEN-REFILL", label: "Refill pack", price: 90000, stock: 24 },
    ],
  },
  {
    slug: "creative-moments-gift-set",
    title: "Creative Moments Gift Set",
    description: "A ready-to-gift bundle for a relaxing afternoon of making.",
    type: "GIFT_SET",
    categorySlug: "gift-sets",
    materials: ["Paper", "Watercolor paints", "Cotton pouch"],
    tags: ["gift", "creative"],
    madeToOrder: false,
    leadTimeDays: 0,
    variants: [
      { sku: "AP-GIFT-CREATIVE-ONE", label: "One set", price: 350000, stock: 7 },
      { sku: "AP-GIFT-CREATIVE-TWO", label: "Two sets", price: 650000, stock: 5 },
    ],
  },
  {
    slug: "little-maker-gift-box",
    title: "Little Maker Gift Box",
    description: "A thoughtfully packed box of small handmade creative treats.",
    type: "GIFT_SET",
    categorySlug: "gift-sets",
    materials: ["Felt", "Paper", "Cotton thread"],
    tags: ["gift", "handmade"],
    madeToOrder: true,
    leadTimeDays: 5,
    variants: [{ sku: "AP-GIFT-MAKER-BOX", label: "Gift box", price: 420000, stock: 9 }],
  },
  {
    slug: "handmade-keepsake-gift-set",
    title: "Handmade Keepsake Gift Set",
    description: "A small gift set of handmade keepsakes for a special occasion.",
    type: "HANDMADE",
    categorySlug: "gift-sets",
    materials: ["Wool felt", "Cotton fabric"],
    tags: ["gift", "keepsake"],
    madeToOrder: true,
    leadTimeDays: 10,
    variants: [
      { sku: "AP-GIFT-KEEP-SINGLE", label: "Single keepsake", price: 260000, stock: 13 },
      { sku: "AP-GIFT-KEEP-PAIR", label: "Pair", price: 460000, stock: 6 },
      { sku: "AP-GIFT-KEEP-FAMILY", label: "Family set", price: 590000, stock: 5 },
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

    for (const category of categories) {
      await prisma.category.upsert({
        where: { slug: category.slug },
        create: category,
        update: { name: category.name },
      });
    }

    for (const product of products) {
      const { variants, categorySlug, ...productData } = product;
      const savedProduct = await prisma.product.upsert({
        where: { slug: product.slug },
        create: {
          ...productData,
          category: { connect: { slug: categorySlug } },
          images: {
            create: {
              url: `https://placehold.co/800x800?text=${encodeURIComponent(product.title)}`,
              alt: product.title,
              position: 0,
            },
          },
        },
        update: {
          ...productData,
          category: { connect: { slug: categorySlug } },
        },
      });

      for (const variant of variants) {
        await prisma.variant.upsert({
          where: { sku: variant.sku },
          create: { ...variant, productId: savedProduct.id },
          update: { ...variant, productId: savedProduct.id },
        });
      }
    }

    console.info(`Seeded ${categories.length} categories, ${products.length} products, and the admin user.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error("Database seeding failed.", error);
  process.exitCode = 1;
});
