-- Phase B: Cloudinary image management fields on ProductImage.
-- publicId stores the Cloudinary public id so an image can be deleted from
-- storage. Nullable + unique: legacy rows (seeded placeholders) have no
-- Cloudinary id, and Postgres allows multiple NULLs in a unique index.
ALTER TABLE "ProductImage" ADD COLUMN "publicId" TEXT;

CREATE UNIQUE INDEX "ProductImage_publicId_key" ON "ProductImage"("publicId");

-- isPrimary marks the leading image; existing rows default to false.
ALTER TABLE "ProductImage" ADD COLUMN "isPrimary" BOOLEAN NOT NULL DEFAULT false;

-- alt becomes optional at rest (empty string); the publish rule still requires
-- alt text on every image before a product can be published.
ALTER TABLE "ProductImage" ALTER COLUMN "alt" SET DEFAULT '';

-- Faster ordered reads of a product's images.
CREATE INDEX "ProductImage_productId_position_idx" ON "ProductImage"("productId", "position");
