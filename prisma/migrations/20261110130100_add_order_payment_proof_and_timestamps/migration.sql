-- Phase 9.5: customer-reported payment proof and per-step timestamps.
-- Existing orders keep NULL timestamps; their transitions remain recorded in
-- "OrderEvent", which is unchanged.
ALTER TABLE "Order"
  ADD COLUMN "paymentNote" TEXT,
  ADD COLUMN "paymentReportedAt" TIMESTAMP(3),
  ADD COLUMN "paidAt" TIMESTAMP(3),
  ADD COLUMN "shippedAt" TIMESTAMP(3),
  ADD COLUMN "deliveredAt" TIMESTAMP(3),
  ADD COLUMN "cancelledAt" TIMESTAMP(3);
