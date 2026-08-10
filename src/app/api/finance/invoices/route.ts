import { NextRequest, NextResponse } from 'next/server'
import { financeService } from '@/server/modules/finance/service'
import { requirePermission } from '@/lib/auth/server/require-role'
import { handleServiceError, parseLimit } from '@/server/shared/http-utils'

export async function GET(req: NextRequest) {
  try {
    const guard = await requirePermission('finance:read')
    if (!guard.ok) return guard.response

    const { searchParams } = req.nextUrl
    const customerId = searchParams.get('customerId') || undefined
    const status = searchParams.get('status') || undefined
    const page = Number(searchParams.get('page')) || 1
    const limit = parseLimit(searchParams)

    const result = await financeService.listInvoices({ customerId, status, page, limit })
    return NextResponse.json(result)
  } catch (err) {
    return handleServiceError(err)
  }
}
