import { beforeEach, describe, expect, it } from 'vitest'
import {
  createMockMarketingAdapter,
  deriveCouponStatus,
} from '@/lib/marketing/mock-adapter'
import type { Coupon } from '@/types/marketing'

/*
  `deriveCouponStatus` تنها منبع تصمیم «کوپن قابل استفاده است؟».
  اگر منطق آن بشکند، یک روز مشتری با کوپن منقضی تخفیف می‌گیرد.
*/

const nowMs = Date.parse('2026-08-07T00:00:00Z')

function baseCoupon(overrides: Partial<Coupon> = {}): Coupon {
  return {
    id: 'x',
    code: 'X',
    kind: 'percent',
    value: 10,
    usedCount: 0,
    startsAt: '2026-01-01T00:00:00Z',
    expiresAt: '2027-01-01T00:00:00Z',
    status: 'active',
    createdAt: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

describe('deriveCouponStatus', () => {
  it('کوپن معتبر → active', () => {
    expect(deriveCouponStatus(baseCoupon(), nowMs)).toBe('active')
  })

  it('گذشته از expiresAt → expired', () => {
    expect(
      deriveCouponStatus(baseCoupon({ expiresAt: '2026-07-01T00:00:00Z' }), nowMs)
    ).toBe('expired')
  })

  it('استفاده به سقف رسیده → exhausted', () => {
    expect(
      deriveCouponStatus(baseCoupon({ usageLimit: 100, usedCount: 100 }), nowMs)
    ).toBe('exhausted')
  })

  it('پیش از startsAt → disabled', () => {
    expect(
      deriveCouponStatus(baseCoupon({ startsAt: '2026-12-01T00:00:00Z' }), nowMs)
    ).toBe('disabled')
  })

  it('حالت disabled به هر دلیل حفظ می‌شود', () => {
    expect(deriveCouponStatus(baseCoupon({ status: 'disabled' }), nowMs)).toBe(
      'disabled'
    )
  })
})

describe('marketing adapter', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('کمپین جدید ذخیره و بازیابی می‌شود', () => {
    const adapter = createMockMarketingAdapter()
    const before = adapter.listCampaigns().length
    const cmp = {
      id: 'cmp-new',
      name: 'Test',
      message: 'hello',
      audienceSegment: 'vip' as const,
      audienceCount: 10,
      deliveredCount: 0,
      failedCount: 0,
      status: 'draft' as const,
      createdAt: new Date().toISOString(),
    }
    const after = adapter.saveCampaign(cmp)
    expect(after.length).toBe(before + 1)
    expect(after.find((c) => c.id === 'cmp-new')?.name).toBe('Test')
  })
})
