import { NextRequest, NextResponse } from 'next/server'
import { shippingService } from '@/server/modules/shipping/service'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const carrier = searchParams.get('carrier') || undefined
  const zone = searchParams.get('zone') || undefined
  const active = searchParams.has('active') ? searchParams.get('active') === 'true' : undefined

  const rates = await shippingService.getShippingRates({ carrier, zone, active })
  return NextResponse.json(rates)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const rate = await shippingService.createShippingRate(body)
  return NextResponse.json(rate, { status: 201 })
}
