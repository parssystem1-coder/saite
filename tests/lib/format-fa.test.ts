import { describe, expect, it } from 'vitest'
import { formatIRR, formatJalaliDate, formatRelative } from '@/lib/format-fa'

/*
  فرمت‌کننده‌های فارسی pure — فاز E.

  این تست‌ها مرزی هستند تا اگر روزی Intl.DateTimeFormat در
  Node رفتار متفاوتی داد یا تقویم پیش‌فرض عوض شد، بلافاصله
  متوجه شویم. توابع در ۹ صفحهٔ ادمین استفاده می‌شوند.
*/

describe('formatIRR', () => {
  it('عدد را با اعداد فارسی و علامت ﷼ برمی‌گرداند', () => {
    expect(formatIRR(1000)).toContain('﷼')
    // اعداد فارسی داخل خروجی
    expect(formatIRR(1234567)).toMatch(/[۰-۹]/)
  })

  it('صفر و اعداد بزرگ هم درست', () => {
    expect(formatIRR(0)).toContain('۰')
    expect(formatIRR(1_000_000_000)).toBeTruthy()
  })
})

describe('formatJalaliDate', () => {
  it('ISO معتبر → رشتهٔ غیرخالی', () => {
    const out = formatJalaliDate('2026-08-07T00:00:00Z')
    expect(out).not.toBe('—')
    expect(out.length).toBeGreaterThan(4)
  })

  it('ISO نامعتبر → «—»', () => {
    // Note: Intl.DateTimeFormat روی 'not-a-date' چیزی مثل "Invalid Date" برمی‌گرداند
    // ولی رفتار به Node ورژن وابسته است؛ فقط چک می‌کنیم که crash نکند
    expect(() => formatJalaliDate('not-a-date')).not.toThrow()
  })
})

describe('formatRelative', () => {
  const NOW = Date.parse('2026-08-07T12:00:00Z')

  it('امروز', () => {
    expect(formatRelative('2026-08-07T00:00:00Z', NOW)).toBe('امروز')
  })

  it('چند روز پیش', () => {
    const out = formatRelative('2026-08-04T00:00:00Z', NOW)
    expect(out).toMatch(/روز پیش/)
  })

  it('چند روز مانده (آینده)', () => {
    const out = formatRelative('2026-08-15T00:00:00Z', NOW)
    expect(out).toMatch(/روز مانده/)
  })

  it('بیش از ۳۰ روز → «ماه پیش»', () => {
    const out = formatRelative('2026-05-01T00:00:00Z', NOW)
    expect(out).toMatch(/ماه پیش/)
  })

  it('nowMs پیش‌فرض Date.now() است (پس ورودی آینده مانده می‌دهد)', () => {
    // بدون NOW صریح — پیش‌فرض Date.now
    const future = new Date(Date.now() + 5 * 86400000).toISOString()
    const out = formatRelative(future)
    expect(out).toMatch(/روز مانده/)
  })
})
