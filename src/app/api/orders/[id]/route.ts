import { NextRequest, NextResponse } from 'next/server'
import { ordersService } from '@/server/modules/orders/service'
import { getCustomerSession } from '@/server/auth/customer-session'
import { canAccessOrder } from '@/lib/auth/customer-scope'
import { handleServiceError } from '@/server/shared/http-utils'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getCustomerSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const order = await ordersService.getById(id)

    if (!canAccessOrder(session.sub, order)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json(order)
  } catch (err) {
    return handleServiceError(err)
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getCustomerSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const body = await req.json()

    const order = await ordersService.getById(id)
    if (!canAccessOrder(session.sub, order)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // فعلاً فقط cancel مجاز است برای مشتری
    if (body.status !== 'cancelled') {
      return NextResponse.json({ error: 'فقط لغو سفارش مجاز است' }, { status: 403 })
    }

    const updated = await ordersService.transitionState(id, body.status, session.sub)
    return NextResponse.json(updated)
  } catch (err) {
    return handleServiceError(err)
  }
}
