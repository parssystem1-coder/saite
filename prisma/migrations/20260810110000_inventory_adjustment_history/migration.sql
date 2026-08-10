CREATE TYPE "InventoryAdjustmentReason" AS ENUM ('receipt', 'correction', 'damaged', 'returned', 'stocktake');

CREATE TABLE "inventory_adjustments" (
  "id" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "delta" INTEGER NOT NULL,
  "reason" "InventoryAdjustmentReason" NOT NULL,
  "note" TEXT,
  "actorId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "inventory_adjustments_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "inventory_adjustments_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT
);
CREATE INDEX "inventory_adjustments_productId_createdAt_idx" ON "inventory_adjustments"("productId", "createdAt");
