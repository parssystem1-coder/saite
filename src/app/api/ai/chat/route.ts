import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { callChat } from '@/server/ai/gateway'
import { consumeRateLimit, getClientKey } from '@/lib/auth/server/rate-limit'
import { getCustomerSession } from '@/server/auth/customer-session'
import { parseWithSchema, parseJsonBody } from '@/server/shared/validation'
import { handleServiceError } from '@/server/shared/http-utils'
import { ValidationError } from '@/server/shared/errors'
import { logger } from '@/server/shared/logger'

/**
 * فقط قالب‌های مشتری‌محور از این endpoint قابل استفاده‌اند.
 *
 * «product-seo» و «admin-assist» قالب‌های ادمین هستند و مسیرهای خودشان
 * (پشت requirePermission) را دارند؛ باز گذاشتن آن‌ها اینجا یعنی هر مشتری
 * لاگین‌شده می‌تواند با هزینهٔ توکن واقعی از قالب‌های ادمین استفاده کند.
 */
const CUSTOMER_FEATURES = ['support-chat'] as const

const chatBodySchema = z.object({
  feature: z.enum(CUSTOMER_FEATURES),
  variables: z.record(z.string().max(64), z.string().max(2000)).refine(
    (v) => Object.keys(v).length <= 20,
    { message: 'حداکثر ۲۰ متغیر مجاز است' }
  ),
  actorId: z.string().min(1).max(100),
})

export async function POST(req: NextRequest) {
  // ── احراز هویت مشتری ──────────────────────────
  const session = await getCustomerSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const clientKey = getClientKey(req.headers)
  const limit = await consumeRateLimit(`ai-chat:${clientKey}`, 10, 60_000)
  if (!limit.allowed) {
    const res = NextResponse.json({ error: 'درخواست بیش از حد مجاز است. لطفاً کمی صبر کنید.' }, { status: 429 })
    res.headers.set('Retry-After', String(limit.retryAfterSeconds))
    return res
  }

  try {
    const { feature, variables, actorId } = parseWithSchema(chatBodySchema, await parseJsonBody(req))

    // actorId باید با session.sub مطابقت داشته باشد — جلوگیری از impersonation
    if (actorId !== session.sub) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const text = await callChat({ feature, variables, actorId })
    return NextResponse.json({ text })
  } catch (err) {
    // خطای اعتبارسنجی باید ۴۰۰ بماند، نه ۵۰۳
    if (err instanceof ValidationError) {
      return handleServiceError(err)
    }
    logger.error({ err }, '[AI Chat]')
    return NextResponse.json(
      { error: 'دستیار هوشمند موقتاً در دسترس نیست', code: 'AI_UNAVAILABLE' },
      { status: 503 }
    )
  }
}
