import { NextRequest, NextResponse } from 'next/server'
import { financeService } from '@/server/modules/finance/service'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const customerId = searchParams.get('customerId') || undefined
  const status = searchParams.get('status') || undefined
  const page = Number(searchParams.get('page')) || 1
  const limit = Number(searchParams.get('limit')) || 20

  const result = await financeService.listInvoices({ customerId, status, page, limit })
  return NextResponse.json(result)
}
