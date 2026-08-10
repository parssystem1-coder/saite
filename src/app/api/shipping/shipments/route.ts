import { NextRequest, NextResponse } from 'next/server'
import { shippingService } from '@/server/modules/shipping/service'
import { requirePermission } from '@/lib/auth/server/require-role'
import { handleServiceError, parseLimit } from '@/server/shared/http-utils'

export async function GET(req: NextRequest) {
  try {
    const guard = await requirePermission('orders:read')
    if (!guard.ok) return guard.response

    const { searchParams } = req.nextUrl
    const carrier = searchParams.get('carrier') || undefined
    const status = searchParams.get('status') || undefined
    const page = Number(searchParams.get('page')) || 1
    const limit = parseLimit(searchParams)

    const result = await shippingService.listShipments({ carrier, status, page, limit })
    return NextResponse.json(result)
  } catch (err) {
    return handleServiceError(err)
  }
}

export async function POST(req: NextRequest) {
  try {
    const guard = await requirePermission('orders:write')
    if (!guard.ok) return guard.response

    const body = await req.json()
    const shipment = await shippingService.createShipment(body)
    return NextResponse.json(shipment, { status: 201 })
  } catch (err) {
    return handleServiceError(err)
  }
}
