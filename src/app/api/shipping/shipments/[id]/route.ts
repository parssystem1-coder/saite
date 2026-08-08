import { NextRequest, NextResponse } from 'next/server'
import { shippingService } from '@/server/modules/shipping/service'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const shipment = await shippingService.getShipment(id)
  if (!shipment) return NextResponse.json({ error: 'Shipment not found' }, { status: 404 })
  return NextResponse.json(shipment)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const shipment = await shippingService.updateStatus(id, body.status, body)
  return NextResponse.json(shipment)
}
