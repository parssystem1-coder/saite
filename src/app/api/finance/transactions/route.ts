import { NextRequest, NextResponse } from 'next/server'
import { financeService } from '@/server/modules/finance/service'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const invoiceId = searchParams.get('invoiceId') || undefined
  const orderId = searchParams.get('orderId') || undefined
  const type = searchParams.get('type') || undefined
  const page = Number(searchParams.get('page')) || 1
  const limit = Number(searchParams.get('limit')) || 20

  const result = await financeService.listTransactions({ invoiceId, orderId, type, page, limit })
  return NextResponse.json(result)
}
