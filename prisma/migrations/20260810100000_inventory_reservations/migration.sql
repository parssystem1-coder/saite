-- Real inventory: all existing catalog items start at zero until counted/imported.
-- This fail-closed backfill prevents overselling from an unknown legacy stock level.
CREATE TYPE "ReservationStatus" AS ENUM ('active', 'confirmed', 'released', 'expired');

CREATE TABLE "inventory_items" (
  "id" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "quantityOnHand" INTEGER NOT NULL DEFAULT 0,
  "quantityReserved" INTEGER NOT NULL DEFAULT 0,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "inventory_items_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "inventory_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX "inventory_items_productId_key" ON "inventory_items"("productId");

CREATE TABLE "inventory_reservations" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL,
  "status" "ReservationStatus" NOT NULL DEFAULT 'active',
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "releasedAt" TIMESTAMP(3),
  CONSTRAINT "inventory_reservations_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "inventory_reservations_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE,
  CONSTRAINT "inventory_reservations_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT
);
CREATE UNIQUE INDEX "inventory_reservations_orderId_productId_key" ON "inventory_reservations"("orderId", "productId");
CREATE INDEX "inventory_reservations_status_expiresAt_idx" ON "inventory_reservations"("status", "expiresAt");
CREATE INDEX "inventory_reservations_productId_status_idx" ON "inventory_reservations"("productId", "status");

INSERT INTO "inventory_items" ("id", "productId", "quantityOnHand", "quantityReserved", "updatedAt")
SELECT 'inv_' || "id", "id", 0, 0, CURRENT_TIMESTAMP FROM "products";
