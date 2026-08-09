import { NextRequest, NextResponse } from 'next/server'
import { shippingService } from '@/server/modules/shipping/service'
import { requirePermission } from '@/lib/auth/server/require-role'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const carrier = searchParams.get('carrier') || undefined
  const zone = searchParams.get('zone') || undefined
  const active = searchParams.has('active') ? searchParams.get('active') === 'true' : undefined

  // فقط نرخ‌های فعال برای عموم — بقیه نیاز به ادمین
  if (active !== true) {
    const guard = await requirePermission('settings:read')
    if (!guard.ok) return guard.response
  }

  const rates = await shippingService.getShippingRates({ carrier, zone, active })
  return NextResponse.json(rates)
}

export async function POST(req: NextRequest) {
  const guard = await requirePermission('settings:write')
  if (!guard.ok) return guard.response

  const body = await req.json()
  const rate = await shippingService.createShippingRate(body)
  return NextResponse.json(rate, { status: 201 })
}
