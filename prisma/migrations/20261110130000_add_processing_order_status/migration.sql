-- Phase 9.5: PAID -> PROCESSING -> SHIPPED.
-- REFUNDED stays in the enum but has no allowed transitions yet.
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'PROCESSING' AFTER 'PAID';
