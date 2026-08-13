import { describe, it, expect } from 'vitest'
import { parseAdvisorSseBlock } from '@/lib/chat/types'

/** قرارداد SSE کلاینت/سرور — دادهٔ خراب هرگز نباید UI را بشکند */
describe('chat SSE parser — تفسیر امن رویدادهای استریم', () => {
  it('رویداد session به‌درستی خوانده می‌شود', () => {
    const block = 'event: session\ndata: {"sessionId":"abc-123"}'
    expect(parseAdvisorSseBlock(block)).toEqual({ type: 'session', sessionId: 'abc-123' })
  })

  it('رویداد delta به‌درستی خوانده می‌شود', () => {
    const block = 'event: delta\ndata: {"text":"سلام"}'
    expect(parseAdvisorSseBlock(block)).toEqual({ type: 'delta', text: 'سلام' })
  })

  it('رویداد done — محصولات با شکل نامعتبر حذف می‌شوند', () => {
    const block = [
      'event: done',
      'data: {"text":"آماده است","products":[{"id":"p1","slug":"s","name":"n","brand":"b","model":"m","images":[]},{"broken":true}]}',
    ].join('\n')
    const event = parseAdvisorSseBlock(block)
    expect(event?.type).toBe('done')
    if (event?.type === 'done') {
      expect(event.products).toHaveLength(1)
      expect(event.products[0].id).toBe('p1')
    }
  })

  it('رویداد error بدون message هم به پیام امن fallback می‌کند', () => {
    expect(parseAdvisorSseBlock('event: error\ndata: {}')).toEqual({
      type: 'error',
      message: 'خطای غیرمنتظره رخ داد.',
    })
  })

  it('JSON خراب یا رویداد ناشناس → null', () => {
    expect(parseAdvisorSseBlock('event: delta\ndata: {oops')).toBeNull()
    expect(parseAdvisorSseBlock('event: mystery\ndata: {"a":1}')).toBeNull()
    expect(parseAdvisorSseBlock('')).toBeNull()
  })

  it('هر نوع حملهٔ تزریق HTML در متن فقط به‌عنوان string عبور می‌کند', () => {
    const evil = '<script>alert(1)</script>'
    const block = `event: delta\ndata: ${JSON.stringify({ text: evil })}`
    const event = parseAdvisorSseBlock(block)
    expect(event).toEqual({ type: 'delta', text: evil })
    // متن دست‌نخورده می‌ماند — امنیت به‌عهدهٔ رندر plain-text آنگاه است
  })
})
