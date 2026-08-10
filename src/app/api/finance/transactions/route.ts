import { NextRequest, NextResponse } from 'next/server'
import { financeService } from '@/server/modules/finance/service'
import { requirePermission } from '@/lib/auth/server/require-role'
import { handleServiceError, parseLimit } from '@/server/shared/http-utils'

export async function GET(req: NextRequest) {
  try {
    const guard = await requirePermission('finance:read')
    if (!guard.ok) return guard.response

    const { searchParams } = req.nextUrl
    const invoiceId = searchParams.get('invoiceId') || undefined
    const orderId = searchParams.get('orderId') || undefined
    const type = searchParams.get('type') || undefined
    const page = Number(searchParams.get('page')) || 1
    const limit = parseLimit(searchParams)

    const result = await financeService.listTransactions({ invoiceId, orderId, type, page, limit })
    return NextResponse.json(result)
  } catch (err) {
    return handleServiceError(err)
  }
}
