import { NextRequest, NextResponse } from 'next/server'
import { marketingService } from '@/server/modules/marketing/service'

export async function POST(req: NextRequest) {
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
