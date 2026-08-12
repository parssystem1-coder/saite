import { NextRequest, NextResponse } from 'next/server'
import { marketingService } from '@/server/modules/marketing/service'
import { consumeRateLimit, getClientKey } from '@/lib/auth/server/rate-limit'
import { getCustomerSession } from '@/server/auth/customer-session'
import { handleServiceError } from '@/server/shared/http-utils'
import { couponValidateSchema, parseWithSchema, parseJsonBody } from '@/server/shared/validation'

/**
 * Validate coupon — Security Model:
 *
 * این endpoint برای validate کوپن قبل از checkout استفاده می‌شود.
 *
 * Security:
 * - Rate limit: 20 requests per minute per IP
 * - Customer session: customerId از session خوانده می‌شود (نه از body)
 * - No sensitive data: فقط discount و finalAmount برمی‌گرداند
 *
 * چرا customerId از session؟
 * - جلوگیری از enumeration: مهاجم نمی‌تواند customerId دیگران را test کند
 * - Consistency: customerId همیشه با session مطابقت دارد
 */

export async function POST(req: NextRequest) {
  // ── Rate limit ──
  const clientKey = getClientKey(req.headers)
  const limit = await consumeRateLimit(`coupon-validate:${clientKey}`, 20, 60_000)
  if (!limit.allowed) {
    const res = NextResponse.json(
      { error: 'درخواست بیش از حد مجاز است.', code: 'RATE_LIMIT_EXCEEDED' },
      { status: 429 }
    )
    res.headers.set('Retry-After', String(limit.retryAfterSeconds))
    return res
  }

  // ── Customer session (optional — اگر login نکرده، بدون customerId validate می‌کنیم) ──
  const session = await getCustomerSession()
  const customerId = session?.sub // اگر session نباشد، undefined

  try {
    const body = parseWithSchema(couponValidateSchema, await parseJsonBody(req))
    const result = await marketingService.validateCoupon(body.code, {
      orderAmount: body.orderAmount,
      customerId: customerId || body.customerId || 'anonymous', // ← از session یا body
      productIds: body.productIds,
      categoryIds: body.categoryIds,
      isFirstOrder: body.isFirstOrder,
    })
    return NextResponse.json(result)
  } catch (err) {
    // CouponValidationError / ValidationError → 400 با code مناسب؛ خطای ناشناخته → 500
    return handleServiceError(err)
  }
}
