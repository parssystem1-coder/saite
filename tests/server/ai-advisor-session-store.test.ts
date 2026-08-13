import { describe, it, expect } from 'vitest'
import {
  appendAdvisorMessages,
  createAdvisorSession,
  loadAdvisorSession,
  MAX_MESSAGE_CHARS,
  __advisorSessionInternals,
} from '@/server/ai/features/sales-advisor/session-store'

/**
 * حافظهٔ گفتگو — در محیط تست روی ذخیره‌گاه حافظه‌ای اجرا می‌شود
 * (الگوی rate-limit repo) ولی رمزنگاری همیشه فعال است.
 */
describe('sales-advisor session-store — حافظهٔ رمزشدهٔ گفتگو', () => {
  it('ساخت سشن — شناسهٔ تصادفی و تاریخچهٔ خالی', () => {
    const session = createAdvisorSession()
    expect(session.sessionId.length).toBeGreaterThanOrEqual(8)
    expect(session.messages).toEqual([])
  })

  it('append + load — پیام‌ها با همان مالک قابل بازیابی‌اند', async () => {
    const session = createAdvisorSession()
    await appendAdvisorMessages(session, 'guest:ip-1', [
      { role: 'user', content: 'سلام' },
      { role: 'assistant', content: 'در خدمتم' },
    ])

    const loaded = await loadAdvisorSession(session.sessionId, 'guest:ip-1')
    expect(loaded).not.toBeNull()
    expect(loaded?.messages).toEqual([
      { role: 'user', content: 'سلام' },
      { role: 'assistant', content: 'در خدمتم' },
    ])
  })

  it('مالکیت — سشن با ownerKey دیگر دیده نمی‌شود (ضد IDOR)', async () => {
    const session = createAdvisorSession()
    await appendAdvisorMessages(session, 'guest:ip-1', [{ role: 'user', content: 'پیام محرمانه' }])

    const trespasser = await loadAdvisorSession(session.sessionId, 'guest:ip-2')
    expect(trespasser).toBeNull()
  })

  it('سشن ناموجود → null (نه خطا، نه ساخت خودکار در load)', async () => {
    const loaded = await loadAdvisorSession('nonexistent-id', 'guest:ip-x')
    expect(loaded).toBeNull()
  })

  it('سقف تعداد پیام رعایت می‌شود — قدیمی‌ترین‌ها حذف می‌شوند', async () => {
    const session = createAdvisorSession()
    const many = Array.from({ length: __advisorSessionInternals.MAX_MESSAGES_PER_SESSION + 4 }, (_, i) => ({
      role: 'user' as const,
      content: `پیام ${i}`,
    }))
    await appendAdvisorMessages(session, 'owner', many)

    const loaded = await loadAdvisorSession(session.sessionId, 'owner')
    expect(loaded?.messages).toHaveLength(__advisorSessionInternals.MAX_MESSAGES_PER_SESSION)
    // به‌جای اولین پیام، آخرین‌ها باقی مانده‌اند
    expect(loaded?.messages.at(-1)?.content).toBe(`پیام ${many.length - 1}`)
  })

  it('پیام بلندتر از سقف در ذخیره بریده می‌شود', async () => {
    const session = createAdvisorSession()
    await appendAdvisorMessages(session, 'owner', [
      { role: 'user', content: 'الف'.repeat(MAX_MESSAGE_CHARS + 500) },
    ])

    const loaded = await loadAdvisorSession(session.sessionId, 'owner')
    expect(loaded?.messages[0].content).toHaveLength(MAX_MESSAGE_CHARS)
  })
})
