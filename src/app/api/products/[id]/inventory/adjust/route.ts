import { NextRequest, NextResponse } from 'next/server'
import { requirePermission } from '@/lib/auth/server/require-role'
import { inventoryService } from '@/server/modules/inventory/service'
import { checkMutationRateLimit, handleServiceError } from '@/server/shared/http-utils'
import { ValidationError } from '@/server/shared/errors'

const reasons = ['receipt', 'correction', 'damaged', 'returned', 'stocktake'] as const
type Reason = (typeof reasons)[number]

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const rateLimited = checkMutationRateLimit(req, 'inventory-adjust', 30, 60_000)
    if (rateLimited) return rateLimited
    const guard = await requirePermission('catalog:write')
    if (!guard.ok) return guard.response

    const body = await req.json() as { delta?: unknown; reason?: unknown; note?: unknown }
    if (typeof body.delta !== 'number' || !Number.isSafeInteger(body.delta) || body.delta === 0) {
      throw new ValidationError({ delta: 'تغییر موجودی باید یک عدد صحیح غیرصفر باشد' })
    }
    if (!reasons.includes(body.reason as Reason)) {
      throw new ValidationError({ reason: 'دلیل تغییر موجودی نامعتبر است' })
    }
    if (body.note !== undefined && (typeof body.note !== 'string' || body.note.length > 500)) {
      throw new ValidationError({ note: 'یادداشت باید حداکثر ۵۰۰ نویسه باشد' })
    }

    const { id } = await params
    const result = await inventoryService.adjustOnHand({
      productId: id,
      delta: body.delta,
      reason: body.reason as Reason,
      note: body.note?.trim(),
      actorId: guard.admin.id,
    })
    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    return handleServiceError(error)
  }
}
