-- Phase 6: richer product content for the storefront.
-- All new text fields are optional so existing products stay valid. The
-- "what's included" list defaults to an empty array and never holds NULL.
ALTER TABLE "Product" ADD COLUMN "shortDescription" TEXT;
ALTER TABLE "Product" ADD COLUMN "whatsIncluded" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Product" ADD COLUMN "size" TEXT;
ALTER TABLE "Product" ADD COLUMN "recommendedAge" TEXT;
ALTER TABLE "Product" ADD COLUMN "safetyNote" TEXT;
