import { NextRequest, NextResponse } from 'next/server'
import { shippingService } from '@/server/modules/shipping/service'
import { requirePermission } from '@/lib/auth/server/require-role'
import { handleServiceError } from '@/server/shared/http-utils'
import { NotFoundError } from '@/server/shared/errors'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const guard = await requirePermission('orders:read')
    if (!guard.ok) return guard.response

    const { id } = await params
    const shipment = await shippingService.getShipment(id)
    if (!shipment) throw new NotFoundError('Shipment not found')
    return NextResponse.json(shipment)
  } catch (err) {
    return handleServiceError(err)
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const guard = await requirePermission('orders:write')
    if (!guard.ok) return guard.response

    const { id } = await params
    const body = await req.json()
    const shipment = await shippingService.updateStatus(id, body.status, body)
    return NextResponse.json(shipment)
  } catch (err) {
    return handleServiceError(err)
  }
}
