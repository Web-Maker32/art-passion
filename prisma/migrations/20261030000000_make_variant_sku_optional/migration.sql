-- Admin product management: SKU becomes optional on variants.
-- Postgres unique indexes allow multiple NULLs, so several variants can omit a SKU.
ALTER TABLE "Variant" ALTER COLUMN "sku" DROP NOT NULL;
