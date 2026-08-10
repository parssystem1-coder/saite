import { NextRequest, NextResponse } from 'next/server'
import { requirePermission } from '@/lib/auth/server/require-role'
import { inventoryService } from '@/server/modules/inventory/service'
import { handleServiceError, checkMutationRateLimit } from '@/server/shared/http-utils'
import { ValidationError } from '@/server/shared/errors'

/** Admin-only stock count endpoint. It never allows on-hand below active reservations. */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const limited = checkMutationRateLimit(req, 'inventory-set', 30, 60_000)
    if (limited) return limited
    const guard = await requirePermission('catalog:write')
    if (!guard.ok) return guard.response
    const { quantityOnHand } = await req.json() as { quantityOnHand?: unknown }
    if (typeof quantityOnHand !== 'number' || !Number.isSafeInteger(quantityOnHand) || quantityOnHand < 0) {
      throw new ValidationError({ quantityOnHand: 'موجودی باید عدد صحیح نامنفی باشد' })
    }
    const safeQuantity = quantityOnHand as number
    const { id } = await params
    await inventoryService.setOnHand(id, safeQuantity)
    return NextResponse.json({ success: true, productId: id, quantityOnHand: safeQuantity })
  } catch (error) {
    return handleServiceError(error)
  }
}
