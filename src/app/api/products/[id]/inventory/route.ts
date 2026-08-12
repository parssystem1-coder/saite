import { NextRequest, NextResponse } from 'next/server'
import { requirePermission } from '@/lib/auth/server/require-role'
import { inventoryService } from '@/server/modules/inventory/service'
import { handleServiceError, checkMutationRateLimit } from '@/server/shared/http-utils'
import { ValidationError } from '@/server/shared/errors'

/** Admin-only stock count endpoint. It never allows on-hand below active reservations. */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const limited = await checkMutationRateLimit(req, 'inventory-set', 30, 60_000)
    if (limited) return limited
    const guard = await requirePermission('catalog:write')
    if (!guard.ok) return guard.response
    const { quantityOnHand, reorderPoint } = await req.json() as { quantityOnHand?: unknown; reorderPoint?: unknown }
    if (quantityOnHand === undefined && reorderPoint === undefined) throw new ValidationError({ body: 'حداقل یک مقدار باید ارسال شود' })
    if (quantityOnHand !== undefined && (typeof quantityOnHand !== 'number' || !Number.isSafeInteger(quantityOnHand) || quantityOnHand < 0)) throw new ValidationError({ quantityOnHand: 'موجودی باید عدد صحیح نامنفی باشد' })
    if (reorderPoint !== undefined && (typeof reorderPoint !== 'number' || !Number.isSafeInteger(reorderPoint) || reorderPoint < 0)) throw new ValidationError({ reorderPoint: 'نقطه سفارش باید عدد صحیح نامنفی باشد' })
    const { id } = await params
    if (quantityOnHand !== undefined) await inventoryService.setOnHand(id, quantityOnHand)
    if (reorderPoint !== undefined) await inventoryService.setReorderPoint(id, reorderPoint)
    return NextResponse.json({ success: true, productId: id, ...(quantityOnHand !== undefined ? { quantityOnHand } : {}), ...(reorderPoint !== undefined ? { reorderPoint } : {}) })
  } catch (error) {
    return handleServiceError(error)
  }
}
