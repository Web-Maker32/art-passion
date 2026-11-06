import dotenv from "dotenv";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../generated/prisma/client";
import { DEMO_TITLE_PREFIX, planDemoCleanup } from "../lib/clean-demo";

dotenv.config({ path: [".env.local", ".env"] });

const dryRun = process.argv.includes("--dry");

/**
 * Removes seeded demo products only.
 *
 * Safe by design:
 * - only products whose title starts with "Sample: " are considered;
 * - products that appear in an order are archived (HIDDEN), never deleted;
 * - orders, order items and payment records are never touched.
 *
 * Usage:
 *   pnpm db:clean-demo          delete/archive sample products
 *   pnpm db:clean-demo --dry    print what would happen, change nothing
 */
async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL must be set before cleaning demo products.");
  }

  const prisma = new PrismaClient({
    adapter: new PrismaNeon({ connectionString }),
  });

  try {
    const products = await prisma.product.findMany({
      where: { title: { startsWith: DEMO_TITLE_PREFIX } },
      orderBy: { title: "asc" },
      select: {
        id: true,
        title: true,
        status: true,
        variants: { select: { id: true } },
      },
    });

    if (products.length === 0) {
      console.info(`No products start with "${DEMO_TITLE_PREFIX}". Nothing to do.`);
      return;
    }

    const variantIds = products.flatMap((product) =>
      product.variants.map((variant) => variant.id),
    );
    const orderedItems =
      variantIds.length > 0
        ? await prisma.orderItem.findMany({
            where: { variantId: { in: variantIds } },
            select: { variantId: true },
            distinct: ["variantId"],
          })
        : [];
    const orderedVariantIds = new Set(
      orderedItems
        .map((item) => item.variantId)
        .filter((id): id is string => id !== null),
    );

    const plan = planDemoCleanup(
      products.map((product) => ({
        id: product.id,
        title: product.title,
        status: product.status,
        variantIds: product.variants.map((variant) => variant.id),
      })),
      orderedVariantIds,
    );

    console.info(
      `Found ${products.length} sample product(s): ${plan.toDelete.length} to delete, ${plan.toArchive.length} to archive.`,
    );

    for (const product of plan.toDelete) {
      console.info(`  delete  ${product.title}`);
    }
    for (const product of plan.toArchive) {
      console.info(
        `  archive ${product.title} (appears in an order; status will be HIDDEN)`,
      );
    }

    if (dryRun) {
      console.info("Dry run: nothing was changed.");
      return;
    }

    if (plan.toDelete.length > 0) {
      const deleted = await prisma.product.deleteMany({
        where: { id: { in: plan.toDelete.map((product) => product.id) } },
      });
      console.info(`Deleted ${deleted.count} product(s) and their variants/images.`);
    }

    if (plan.toArchive.length > 0) {
      const archived = await prisma.product.updateMany({
        where: {
          id: { in: plan.toArchive.map((product) => product.id) },
          status: { not: "HIDDEN" },
        },
        data: { status: "HIDDEN" },
      });
      console.info(`Archived ${archived.count} product(s).`);
    }

    console.info("Orders were not modified.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error("Cleaning demo products failed.", error);
  process.exitCode = 1;
});
