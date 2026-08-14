import { NextRequest, NextResponse } from 'next/server'
import { shippingService } from '@/server/modules/shipping/service'
import { requirePermission } from '@/lib/auth/server/require-role'
import { handleServiceError } from '@/server/shared/http-utils'
import { checkRouteRateLimit } from '@/server/shared/rate-limit-policy'
import { shippingRateCreateSchema, parseWithSchema, parseJsonBody } from '@/server/shared/validation'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const carrier = searchParams.get('carrier') || undefined
    const zone = searchParams.get('zone') || undefined
    const active = searchParams.has('active') ? searchParams.get('active') === 'true' : undefined

    // فقط نرخ‌های فعال برای عموم — بقیه نیاز به ادمین
    if (active !== true) {
      const guard = await requirePermission('settings:read')
      if (!guard.ok) return guard.response
    }

    const rates = await shippingService.getShippingRates({ carrier, zone, active })
    return NextResponse.json(rates)
  } catch (err) {
    return handleServiceError(err)
  }
}

export async function POST(req: NextRequest) {
  try {
    const rateLimit = await checkRouteRateLimit(req, 'shipping-rate-create')
    if (rateLimit) return rateLimit

    const guard = await requirePermission('settings:write')
    if (!guard.ok) return guard.response

    const body = parseWithSchema(shippingRateCreateSchema, await parseJsonBody(req))
    const rate = await shippingService.createShippingRate(body)
    return NextResponse.json(rate, { status: 201 })
  } catch (err) {
    return handleServiceError(err)
  }
}
