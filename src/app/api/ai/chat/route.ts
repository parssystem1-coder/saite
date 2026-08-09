import { NextRequest, NextResponse } from 'next/server'
import { callChat } from '@/server/ai/gateway'
import { consumeRateLimit, getClientKey } from '@/lib/auth/server/rate-limit'

export async function POST(req: NextRequest) {
  const clientKey = getClientKey(req.headers)
  const limit = consumeRateLimit(`ai-chat:${clientKey}`, 10, 60_000)
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

    const text = await callChat({ feature, variables, actorId })
    return NextResponse.json({ text })
  } catch (err) {
    console.error('[AI Chat]', err)
    return NextResponse.json(
      { error: 'دستیار هوشمند موقتاً در دسترس نیست' },
      { status: 503 }
    )
  }
}
