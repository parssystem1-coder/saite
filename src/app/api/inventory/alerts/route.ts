import { NextResponse } from 'next/server'
import { prisma } from '@/server/shared/db'
import { requirePermission } from '@/lib/auth/server/require-role'
import { handleServiceError } from '@/server/shared/http-utils'

export async function GET() {
  try {
    const guard = await requirePermission('reports:read')
    if (!guard.ok) return guard.response
    const items = (await prisma.$queryRawUnsafe(`
      SELECT p.id, p.name, p.sku, i."quantityOnHand" - i."quantityReserved" AS "quantityAvailable", i."reorderPoint"
      FROM "inventory_items" i INNER JOIN products p ON p.id = i."productId"
      WHERE i."quantityOnHand" - i."quantityReserved" <= i."reorderPoint"
      ORDER BY "quantityAvailable" ASC, p.name ASC LIMIT 10
    `)) as Array<{ id: string; name: string; sku: string; quantityAvailable: number; reorderPoint: number }>
    return NextResponse.json({ items, total: items.length })
  } catch (error) { return handleServiceError(error) }
}
