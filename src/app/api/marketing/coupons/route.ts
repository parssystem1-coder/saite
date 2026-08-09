import { NextRequest, NextResponse } from 'next/server'
import { marketingService } from '@/server/modules/marketing/service'
import { requirePermission } from '@/lib/auth/server/require-role'

export async function GET(req: NextRequest) {
  const guard = await requirePermission('marketing:read')
  if (!guard.ok) return guard.response

  const { searchParams } = req.nextUrl
  const active = searchParams.has('active') ? searchParams.get('active') === 'true' : undefined
  const page = Number(searchParams.get('page')) || 1
  const limit = Number(searchParams.get('limit')) || 20

  const result = await marketingService.listCoupons({ active, page, limit })
  return NextResponse.json(result)
}

export async function POST(req: NextRequest) {
  const guard = await requirePermission('marketing:write')
  if (!guard.ok) return guard.response

  const body = await req.json()
  const coupon = await marketingService.createCoupon(body)
  return NextResponse.json(coupon, { status: 201 })
}
