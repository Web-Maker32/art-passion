-- Admin order management: shipping courier, payment reference, and a one-time stock-restore guard.
ALTER TABLE "Order"
  ADD COLUMN "courierName" TEXT;

ALTER TABLE "Order"
  ADD COLUMN "paymentReference" TEXT;

-- Set once when a cancellation restores stock; guards against a double restore.
ALTER TABLE "Order"
  ADD COLUMN "stockRestoredAt" TIMESTAMP(3);

-- Order date, used for the admin list (newest first) and the dashboard "today" count.
-- Existing rows take the migration time; acceptable for the pre-launch dev database.
ALTER TABLE "Order"
  ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX "Order_createdAt_idx" ON "Order"("createdAt");

-- Snapshot the variant and made-to-order flag on each line so a cancellation can restock.
-- Existing rows keep NULL variantId and are therefore skipped on restore (dev data can be reset).
ALTER TABLE "OrderItem"
  ADD COLUMN "variantId" TEXT;

ALTER TABLE "OrderItem"
  ADD COLUMN "madeToOrder" BOOLEAN NOT NULL DEFAULT false;

-- Audit trail for every admin-driven order change.
CREATE TABLE "OrderEvent" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "fromStatus" "OrderStatus",
  "toStatus" "OrderStatus",
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OrderEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "OrderEvent_orderId_createdAt_idx" ON "OrderEvent"("orderId", "createdAt");

ALTER TABLE "OrderEvent"
  ADD CONSTRAINT "OrderEvent_orderId_fkey"
  FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
