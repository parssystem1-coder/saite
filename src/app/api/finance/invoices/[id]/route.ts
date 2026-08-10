import { NextResponse } from 'next/server'
import { financeService } from '@/server/modules/finance/service'
import { requirePermission } from '@/lib/auth/server/require-role'
import { handleServiceError } from '@/server/shared/http-utils'
import { NotFoundError } from '@/server/shared/errors'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const guard = await requirePermission('finance:read')
    if (!guard.ok) return guard.response

    const { id } = await params
    const invoice = await financeService.getInvoice(id)
    if (!invoice) throw new NotFoundError('Invoice not found')
    return NextResponse.json(invoice)
  } catch (err) {
    return handleServiceError(err)
  }
}
