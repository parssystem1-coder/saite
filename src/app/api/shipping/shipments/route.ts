import { NextRequest, NextResponse } from 'next/server'
import { shippingService } from '@/server/modules/shipping/service'
import { requirePermission } from '@/lib/auth/server/require-role'

export async function GET(req: NextRequest) {
  const guard = await requirePermission('orders:read')
  if (!guard.ok) return guard.response

  const { searchParams } = req.nextUrl
  const carrier = searchParams.get('carrier') || undefined
  const status = searchParams.get('status') || undefined
  const page = Number(searchParams.get('page')) || 1
  const limit = Number(searchParams.get('limit')) || 20

  const result = await shippingService.listShipments({ carrier, status, page, limit })
  return NextResponse.json(result)
}

export async function POST(req: NextRequest) {
  const guard = await requirePermission('orders:write')
  if (!guard.ok) return guard.response

  const body = await req.json()
  const shipment = await shippingService.createShipment(body)
  return NextResponse.json(shipment, { status: 201 })
}
