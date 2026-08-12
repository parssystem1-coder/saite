import { NextRequest, NextResponse } from 'next/server'
import { ordersService } from '@/server/modules/orders/service'
import { getCustomerSession } from '@/server/auth/customer-session'
import { canAccessOrder } from '@/lib/auth/customer-scope'
import { handleServiceError } from '@/server/shared/http-utils'
import { parseWithSchema, parseJsonBody } from '@/server/shared/validation'
import { z } from 'zod'

// مشتری فقط می‌تواند سفارش را لغو کند — وضعیت دقیقاً 'cancelled'
const customerCancelSchema = z.object({ status: z.literal('cancelled') })

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
    const body = parseWithSchema(customerCancelSchema, await parseJsonBody(req))

    const order = await ordersService.getById(id)
    if (!canAccessOrder(session.sub, order)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const updated = await ordersService.transitionState(id, body.status, session.sub)
    return NextResponse.json(updated)
  } catch (err) {
    return handleServiceError(err)
  }
}
