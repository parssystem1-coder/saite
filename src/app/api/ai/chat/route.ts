import { NextRequest, NextResponse } from 'next/server'
import { callChat } from '@/server/ai/gateway'

export async function POST(req: NextRequest) {
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
