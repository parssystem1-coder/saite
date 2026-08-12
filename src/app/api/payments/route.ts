import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { paymentsService } from '@/server/payments/service'
import { getCustomerSession } from '@/server/auth/customer-session'
import { handleServiceError, checkMutationRateLimit } from '@/server/shared/http-utils'
import { parseWithSchema, parseJsonBody } from '@/server/shared/validation'

const initSchema = z.object({
  orderId: z.string().min(1),
})

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * POST /api/payments
 *
 * شروع پرداخت برای یک سفارش پرداخت‌نشدهٔ مشتری. پاسخ شامل redirectUrl
 * است که کلاینت باید کاربر را به آن هدایت کند.
 *
 * Security:
 * - احراز هویت مشتری (session) الزامی است
 * - مالکیت سفارش در سرویس بررسی می‌شود (customerId از session)
 * - rate-limit روی ایجاد intent
 */
export async function POST(req: NextRequest) {
  try {
    const rateLimitResponse = checkMutationRateLimit(req, 'payment-init', 10, 60_000)
    if (rateLimitResponse) return rateLimitResponse

    const session = await getCustomerSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 })
    }

    const body = parseWithSchema(initSchema, await parseJsonBody(req))
    const result = await paymentsService.initialize(body.orderId, session.sub)
    return NextResponse.json(result, { status: 200 })
  } catch (err) {
    return handleServiceError(err)
  }
}
