import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  __resetAllRateLimits,
  consumeRateLimit,
  getClientKey,
  resetRateLimit,
} from '@/lib/auth/server/rate-limit'

/**
 * محدودیت نرخ سمت سرور.
 *
 * ── چرا این تست‌ها لازم‌اند ───────────────────────────────────
 * `useLoginThrottle` سمت کلاینت با یک رفرش صفحه دور می‌خورد و با
 * curl اصلاً وجود ندارد. این لایه تنها چیزی است که واقعاً جلوی
 * حدس خودکار رمز را می‌گیرد.
 */

beforeEach(async () => {
  await __resetAllRateLimits()
  vi.useRealTimers()
})

describe('شمارش تلاش', () => {
  it('تا سقف مجاز اجازه می‌دهد', async () => {
    for (let i = 0; i < 5; i++) {
      expect((await consumeRateLimit('ip-1', 5, 60_000)).allowed).toBe(true)
    }
  })

  it('🔑 پس از سقف، مسدود می‌کند', async () => {
    for (let i = 0; i < 5; i++) await consumeRateLimit('ip-1', 5, 60_000)

    const result = await consumeRateLimit('ip-1', 5, 60_000)
    expect(result.allowed).toBe(false)
    expect(result.retryAfterSeconds).toBeGreaterThan(0)
  })

  it('تلاش‌های باقی‌مانده درست شمرده می‌شود', async () => {
    expect((await consumeRateLimit('ip-1', 3, 60_000)).remaining).toBe(2)
    expect((await consumeRateLimit('ip-1', 3, 60_000)).remaining).toBe(1)
    expect((await consumeRateLimit('ip-1', 3, 60_000)).remaining).toBe(0)
  })

  it('🔑 هر IP سطل جداگانه دارد', async () => {
    for (let i = 0; i < 5; i++) await consumeRateLimit('ip-1', 5, 60_000)

    // مسدود شدن یک کاربر نباید بقیه را قفل کند
    expect((await consumeRateLimit('ip-1', 5, 60_000)).allowed).toBe(false)
    expect((await consumeRateLimit('ip-2', 5, 60_000)).allowed).toBe(true)
  })
})

describe('پنجرهٔ زمانی', () => {
  it('پس از پایان پنجره دوباره باز می‌شود', async () => {
    for (let i = 0; i < 5; i++) await consumeRateLimit('ip-1', 5, 60_000)
    expect((await consumeRateLimit('ip-1', 5, 60_000)).allowed).toBe(false)

    vi.useFakeTimers()
    vi.setSystemTime(Date.now() + 61_000)

    expect((await consumeRateLimit('ip-1', 5, 60_000)).allowed).toBe(true)
    vi.useRealTimers()
  })
})

describe('بازنشانی پس از ورود موفق', () => {
  it('🔑 ورود موفق شمارنده را آزاد می‌کند', async () => {
    for (let i = 0; i < 4; i++) await consumeRateLimit('ip-1', 5, 60_000)

    /*
      سناریو: کاربر واقعی چهار بار رمز را اشتباه زده، بار پنجم
      درست وارد می‌شود. نباید دفعهٔ بعد با یک اشتباه قفل شود.
    */
    await resetRateLimit('ip-1')

    expect((await consumeRateLimit('ip-1', 5, 60_000)).remaining).toBe(4)
  })
})

describe('استخراج شناسهٔ کلاینت', () => {
  it('اولین IP از x-forwarded-for را می‌گیرد', () => {
    const headers = new Headers({ 'x-forwarded-for': '203.0.113.5, 70.41.3.18' })
    expect(getClientKey(headers)).toBe('203.0.113.5')
  })

  it('به x-real-ip برمی‌گردد', () => {
    const headers = new Headers({ 'x-real-ip': '198.51.100.7' })
    expect(getClientKey(headers)).toBe('198.51.100.7')
  })

  it('بدون هدر، کلید ثابت می‌دهد — نه undefined', () => {
    expect(getClientKey(new Headers())).toBe('unknown-client')
  })

  it('فاصلهٔ اضافی حذف می‌شود', () => {
    const headers = new Headers({ 'x-forwarded-for': '  203.0.113.5  , 10.0.0.1' })
    expect(getClientKey(headers)).toBe('203.0.113.5')
  })
})
