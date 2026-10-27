DO $$
BEGIN
  CREATE TYPE "PaymentMethod" AS ENUM ('WALLET_TRANSFER');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "Order"
  ADD COLUMN "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'WALLET_TRANSFER';

-- Existing orders intentionally keep a NULL token hash and are not token-accessible.
-- Their confirmation URL cannot be recovered; an order number alone grants no access.
ALTER TABLE "Order"
  ADD COLUMN "accessTokenHash" TEXT;

ALTER TABLE "Order"
  ADD COLUMN "orderNotes" TEXT;

ALTER TABLE "Order"
  ADD COLUMN "idempotencyKey" TEXT;

UPDATE "Order"
SET "idempotencyKey" = gen_random_uuid()::text
WHERE "idempotencyKey" IS NULL;

ALTER TABLE "Order"
  ALTER COLUMN "idempotencyKey" SET NOT NULL;

-- Keep this index transactional; CREATE INDEX CONCURRENTLY cannot run in Prisma's migration transaction.
CREATE UNIQUE INDEX "Order_idempotencyKey_key"
  ON "Order"("idempotencyKey");

ALTER TABLE "Order"
  ALTER COLUMN "customerEmail" DROP NOT NULL;

ALTER TABLE "Order"
  ALTER COLUMN "postalCode" DROP NOT NULL;

-- These fields preserve order notes and made-to-order lead-time snapshots without overloading unrelated fields.
ALTER TABLE "OrderItem"
  ADD COLUMN "leadTimeDays" INTEGER;

-- Supplies AP-YYYY-NNNN numbers without scanning existing orders.
CREATE TABLE "OrderCounter" (
  "year" INTEGER NOT NULL,
  "value" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "OrderCounter_pkey" PRIMARY KEY ("year")
);
