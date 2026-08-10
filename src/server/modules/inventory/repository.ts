import 'server-only'
/* eslint-disable @typescript-eslint/no-explicit-any -- raw SQL is required for conditional atomic stock update */
import { prisma } from '@/server/shared/db'
import { ValidationError } from '@/server/shared/errors'

export type InventoryLine = { productId: string; quantity: number }
type Tx = { $queryRawUnsafe: <T = unknown>(query: string, ...values: unknown[]) => Promise<T>; $executeRawUnsafe: (query: string, ...values: unknown[]) => Promise<number> }

/** Atomic inventory operations. Bound parameters keep raw SQL safe. */
export const inventoryRepository = {
  async reserveForOrder(tx: Tx, orderId: string, items: InventoryLine[], expiresAt: Date) {
    for (const item of items) {
      const updated = await tx.$queryRawUnsafe<{ productId: string }[]>(
        `UPDATE "inventory_items" SET "quantityReserved" = "quantityReserved" + $1, "updatedAt" = NOW()
         WHERE "productId" = $2 AND "quantityOnHand" - "quantityReserved" >= $1 RETURNING "productId"`,
        item.quantity, item.productId
      )
      if (updated.length !== 1) throw new ValidationError({ items: `موجودی قابل فروش محصول ${item.productId} کافی نیست` })
      await tx.$executeRawUnsafe(
        `INSERT INTO "inventory_reservations" ("id", "orderId", "productId", "quantity", "status", "expiresAt", "createdAt")
         VALUES (concat('res_', md5(random()::text || clock_timestamp()::text)), $1, $2, $3, 'active', $4, NOW())`,
        orderId, item.productId, item.quantity, expiresAt
      )
    }
  },

  async confirmOrder(orderId: string) {
    return prisma.$transaction(async (tx: any) => {
      const reservations = (await tx.$queryRawUnsafe(
        `SELECT "productId", "quantity" FROM "inventory_reservations" WHERE "orderId" = $1 AND "status" = 'active' FOR UPDATE`, orderId)) as InventoryLine[]
      for (const r of reservations) await tx.$executeRawUnsafe(
        `UPDATE "inventory_items" SET "quantityOnHand" = "quantityOnHand" - $1, "quantityReserved" = "quantityReserved" - $1, "updatedAt" = NOW() WHERE "productId" = $2`, r.quantity, r.productId)
      await tx.$executeRawUnsafe(`UPDATE "inventory_reservations" SET "status" = 'confirmed' WHERE "orderId" = $1 AND "status" = 'active'`, orderId)
    })
  },

  async releaseOrder(orderId: string, status: 'released' | 'expired' = 'released') {
    return prisma.$transaction(async (tx: any) => {
      const reservations = (await tx.$queryRawUnsafe(
        `SELECT "productId", "quantity" FROM "inventory_reservations" WHERE "orderId" = $1 AND "status" = 'active' FOR UPDATE`, orderId)) as InventoryLine[]
      for (const r of reservations) await tx.$executeRawUnsafe(
        `UPDATE "inventory_items" SET "quantityReserved" = "quantityReserved" - $1, "updatedAt" = NOW() WHERE "productId" = $2`, r.quantity, r.productId)
      await tx.$executeRawUnsafe(`UPDATE "inventory_reservations" SET "status" = $1::"ReservationStatus", "releasedAt" = NOW() WHERE "orderId" = $2 AND "status" = 'active'`, status, orderId)
      return reservations.length
    })
  },

  async adjustOnHand(input: { productId: string; delta: number; reason: 'receipt' | 'correction' | 'damaged' | 'returned' | 'stocktake'; note?: string; actorId: string }) {
    return prisma.$transaction(async (tx: any) => {
      // Row lock serializes adjustments with checkout reservations.
      const current = (await tx.$queryRawUnsafe(
        `SELECT "quantityOnHand", "quantityReserved" FROM "inventory_items" WHERE "productId" = $1 FOR UPDATE`, input.productId
      )) as Array<{ quantityOnHand: number; quantityReserved: number }>
      const item = current[0]
      if (!item || item.quantityOnHand + input.delta < item.quantityReserved) {
        throw new ValidationError({ delta: 'موجودی پس از تغییر نمی‌تواند از رزرو فعال کمتر شود' })
      }
      await tx.$executeRawUnsafe(
        `UPDATE "inventory_items" SET "quantityOnHand" = "quantityOnHand" + $1, "updatedAt" = NOW() WHERE "productId" = $2`,
        input.delta, input.productId
      )
      await tx.$executeRawUnsafe(
        `INSERT INTO "inventory_adjustments" ("id", "productId", "delta", "reason", "note", "actorId", "createdAt")
         VALUES (concat('adj_', md5(random()::text || clock_timestamp()::text)), $1, $2, $3::"InventoryAdjustmentReason", $4, $5, NOW())`,
        input.productId, input.delta, input.reason, input.note ?? null, input.actorId
      )
      return { quantityOnHand: item.quantityOnHand + input.delta, quantityReserved: item.quantityReserved }
    })
  },

  async setOnHand(productId: string, quantityOnHand: number) {
    const result = (await prisma.$queryRawUnsafe(
      `UPDATE "inventory_items" SET "quantityOnHand" = $1, "updatedAt" = NOW()
       WHERE "productId" = $2 AND "quantityReserved" <= $1 RETURNING "productId"`, quantityOnHand, productId)) as { productId: string }[]
    if (result.length !== 1) {
      throw new ValidationError({ quantityOnHand: 'مقدار موجودی از رزرو فعال کمتر است یا محصول یافت نشد' })
    }
  },

  async expireReservations(now = new Date()) {
    const orders = (await prisma.$queryRawUnsafe(
      `SELECT DISTINCT "orderId" FROM "inventory_reservations" WHERE "status" = 'active' AND "expiresAt" <= $1`, now)) as { orderId: string }[]
    for (const { orderId } of orders) await this.releaseOrder(orderId, 'expired')
    return orders.length
  },
}
