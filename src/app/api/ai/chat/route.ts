import { NextRequest, NextResponse } from 'next/server'
import { callChat } from '@/server/ai/gateway'
import { consumeRateLimit, getClientKey } from '@/lib/auth/server/rate-limit'
import { getCustomerSession } from '@/server/auth/customer-session'
import { logger } from '@/server/shared/logger'

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
    const { feature, variables, actorId } = await req.json()

    if (!feature || !variables || !actorId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // actorId باید با session.sub مطابقت داشته باشد — جلوگیری از impersonation
    if (actorId !== session.sub) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const text = await callChat({ feature, variables, actorId })
    return NextResponse.json({ text })
  } catch (err) {
    logger.error({ err }, '[AI Chat]')
    return NextResponse.json(
      { error: 'دستیار هوشمند موقتاً در دسترس نیست', code: 'AI_UNAVAILABLE' },
      { status: 503 }
    )
  }
}
