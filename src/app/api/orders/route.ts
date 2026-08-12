import { NextRequest, NextResponse } from 'next/server'
import { ordersService } from '@/server/modules/orders/service'
import { getCustomerSession } from '@/server/auth/customer-session'
import { handleServiceError, checkMutationRateLimit } from '@/server/shared/http-utils'
import { createOrderSchema, parseWithSchema, parseJsonBody } from '@/server/shared/validation'

export async function GET(req: NextRequest) {
  try {
    const session = await getCustomerSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = req.nextUrl
    const page = Number(searchParams.get('page')) || 1
    const perPage = Number(searchParams.get('perPage')) || 10

    const result = await ordersService.getCustomerOrders(session.sub, page, perPage)
    return NextResponse.json(result)
  } catch (err) {
    return handleServiceError(err)
  }
}

export async function POST(req: NextRequest) {
  try {
    // Rate-limit برای جلوگیری از abuse
    const rateLimitResponse = checkMutationRateLimit(req, 'order-create', 10, 60_000)
    if (rateLimitResponse) return rateLimitResponse

    const session = await getCustomerSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 })

    const body = parseWithSchema(createOrderSchema, await parseJsonBody(req))
    const order = await ordersService.create({
      customerId: session.sub,
      items: body.items,
      shippingAddress: body.shippingAddress,
    })
    return NextResponse.json(order, { status: 201 })
  } catch (err) {
    return handleServiceError(err)
  }
}
