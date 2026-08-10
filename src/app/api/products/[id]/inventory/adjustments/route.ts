import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/server/shared/db'
import { requirePermission } from '@/lib/auth/server/require-role'
import { handleServiceError, parseLimit } from '@/server/shared/http-utils'

export interface InventoryAdjustmentRow {
  id: string
  delta: number
  reason: 'receipt' | 'correction' | 'damaged' | 'returned' | 'stocktake'
  note: string | null
  actorId: string
  createdAt: Date
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const guard = await requirePermission('reports:read')
    if (!guard.ok) return guard.response
    const { id } = await params
    const limit = parseLimit(req.nextUrl.searchParams, 20, 100)
    const items = (await prisma.$queryRawUnsafe(
      `SELECT id, delta, reason, note, "actorId", "createdAt"
       FROM "inventory_adjustments" WHERE "productId" = $1
       ORDER BY "createdAt" DESC LIMIT $2`, id, limit
    )) as InventoryAdjustmentRow[]
    return NextResponse.json({ items })
  } catch (error) {
    return handleServiceError(error)
  }
}
