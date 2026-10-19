ALTER TABLE "CartItem" ADD COLUMN "unitPrice" INTEGER;

UPDATE "CartItem" AS item
SET "unitPrice" = variant."price"
FROM "Variant" AS variant
WHERE item."variantId" = variant."id";

ALTER TABLE "CartItem" ALTER COLUMN "unitPrice" SET NOT NULL;
