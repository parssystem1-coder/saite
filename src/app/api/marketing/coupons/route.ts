import { NextRequest, NextResponse } from 'next/server'
import { marketingService } from '@/server/modules/marketing/service'
import { requirePermission } from '@/lib/auth/server/require-role'
import { handleServiceError, parseLimit } from '@/server/shared/http-utils'
import { checkRouteRateLimit } from '@/server/shared/rate-limit-policy'
import { couponCreateSchema, parseWithSchema, parseJsonBody } from '@/server/shared/validation'

export async function GET(req: NextRequest) {
  try {
    const guard = await requirePermission('marketing:read')
    if (!guard.ok) return guard.response

    const { searchParams } = req.nextUrl
    const active = searchParams.has('active') ? searchParams.get('active') === 'true' : undefined
    const page = Number(searchParams.get('page')) || 1
    const limit = parseLimit(searchParams)

    const result = await marketingService.listCoupons({ active, page, limit })
    return NextResponse.json(result)
  } catch (err) {
    return handleServiceError(err)
  }
}

export async function POST(req: NextRequest) {
  try {
    const rateLimit = await checkRouteRateLimit(req, 'coupon-create')
    if (rateLimit) return rateLimit

    const guard = await requirePermission('marketing:write')
    if (!guard.ok) return guard.response

    const body = parseWithSchema(couponCreateSchema, await parseJsonBody(req))
    const coupon = await marketingService.createCoupon(body)
    return NextResponse.json(coupon, { status: 201 })
  } catch (err) {
    return handleServiceError(err)
  }
}
