import { NextRequest, NextResponse } from 'next/server'
import { marketingService } from '@/server/modules/marketing/service'
import { consumeRateLimit, getClientKey } from '@/lib/auth/server/rate-limit'

export async function POST(req: NextRequest) {
  const clientKey = getClientKey(req.headers)
  const limit = consumeRateLimit(`coupon-validate:${clientKey}`, 20, 60_000)
  if (!limit.allowed) {
    const res = NextResponse.json({ error: 'درخواست بیش از حد مجاز است.' }, { status: 429 })
    res.headers.set('Retry-After', String(limit.retryAfterSeconds))
    return res
  }

  try {
    const body = await req.json()
    const result = await marketingService.validateCoupon(body.code, {
      orderAmount: body.orderAmount,
      customerId: body.customerId,
      productIds: body.productIds,
      categoryIds: body.categoryIds,
      isFirstOrder: body.isFirstOrder,
    })
    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Validation failed'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
