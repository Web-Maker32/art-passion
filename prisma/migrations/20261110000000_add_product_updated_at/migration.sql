-- Phase 8: real lastModified values for sitemap.xml.
-- Existing rows get the migration time; Prisma's @updatedAt keeps it current
-- from now on whenever an admin edits a product.
ALTER TABLE "Product" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
