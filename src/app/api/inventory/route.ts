import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/server/shared/db'
import { requirePermission } from '@/lib/auth/server/require-role'
import { handleServiceError, parseLimit } from '@/server/shared/http-utils'

export interface InventoryReportRow {
  productId: string
  sku: string
  name: string
  quantityOnHand: number
  quantityReserved: number
  quantityAvailable: number
  activeReservations: number
}

/** Real inventory dashboard data. Never exposes stock information publicly. */
export async function GET(req: NextRequest) {
  try {
    const guard = await requirePermission('reports:read')
    if (!guard.ok) return guard.response

    const { searchParams } = req.nextUrl
    const limit = parseLimit(searchParams, 100, 250)
    const status = searchParams.get('status')
    const where =
      status === 'out'
        ? 'WHERE i."quantityOnHand" - i."quantityReserved" <= 0'
        : status === 'low'
          ? 'WHERE i."quantityOnHand" - i."quantityReserved" BETWEEN 1 AND 5'
          : status === 'ok'
            ? 'WHERE i."quantityOnHand" - i."quantityReserved" > 5'
            : ''

    // `status` only selects a fixed SQL fragment and all data values are bound.
    const rows = (await prisma.$queryRawUnsafe(`
      SELECT p.id AS "productId", p.sku, p.name,
        i."quantityOnHand", i."quantityReserved",
        i."quantityOnHand" - i."quantityReserved" AS "quantityAvailable",
        COUNT(r.id)::int AS "activeReservations"
      FROM "inventory_items" i
      INNER JOIN products p ON p.id = i."productId"
      LEFT JOIN "inventory_reservations" r ON r."productId" = p.id AND r.status = 'active'
      ${where}
      GROUP BY p.id, p.sku, p.name, i."quantityOnHand", i."quantityReserved"
      ORDER BY "quantityAvailable" ASC, p.name ASC
      LIMIT $1
    `, limit)) as InventoryReportRow[]

    return NextResponse.json({ items: rows, total: rows.length })
  } catch (error) {
    return handleServiceError(error)
  }
}
