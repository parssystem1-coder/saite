import { NextResponse } from 'next/server'
import { financeService } from '@/server/modules/finance/service'
import { requirePermission } from '@/lib/auth/server/require-role'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requirePermission('finance:read')
  if (!guard.ok) return guard.response

  const { id } = await params
  const invoice = await financeService.getInvoice(id)
  if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
  return NextResponse.json(invoice)
}
