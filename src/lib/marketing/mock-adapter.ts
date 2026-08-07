import type { Coupon, SmsCampaign } from '@/types/marketing'

const KEYS = {
  coupons: 'saite.marketing.coupons',
  campaigns: 'saite.marketing.campaigns',
} as const

function safeRead<T>(key: string, fallbackValue: T): T {
  if (typeof window === 'undefined') return fallbackValue
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return fallbackValue
    const parsed = JSON.parse(raw) as unknown
    return (parsed as T) ?? fallbackValue
  } catch {
    return fallbackValue
  }
}

function safeWrite(key: string, value: unknown): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* full storage */
  }
}

const daysFrom = (n: number) => new Date(Date.now() + n * 86400000).toISOString()

function couponsFallback(): Coupon[] {
  return [
    {
      id: 'cp-1',
      code: 'WELCOME15',
      description: 'تخفیف خوش‌آمدگویی مشتریان جدید',
      kind: 'percent',
      value: 15,
      maxDiscount: 500000,
      minCartValue: 2000000,
      usageLimit: 500,
      usedCount: 128,
      startsAt: daysFrom(-30),
      expiresAt: daysFrom(30),
      status: 'active',
      createdAt: daysFrom(-30),
    },
    {
      id: 'cp-2',
      code: 'TONER10',
      description: 'تخفیف مخصوص دستهٔ مصرفی',
      kind: 'percent',
      value: 10,
      usageLimit: 200,
      usedCount: 200,
      startsAt: daysFrom(-60),
      expiresAt: daysFrom(60),
      restrictedCategories: ['toner', 'consumable'],
      status: 'exhausted',
      createdAt: daysFrom(-60),
    },
    {
      id: 'cp-3',
      code: 'PARSDAY50K',
      description: 'تخفیف روز پارسی',
      kind: 'fixed',
      value: 500000,
      minCartValue: 5000000,
      usageLimit: 100,
      usedCount: 45,
      startsAt: daysFrom(-90),
      expiresAt: daysFrom(-1),
      status: 'expired',
      createdAt: daysFrom(-90),
    },
  ]
}

function campaignsFallback(): SmsCampaign[] {
  return [
    {
      id: 'cmp-1',
      name: 'اطلاع‌رسانی جمعهٔ سیاه',
      message: 'مشتری گرامی، تخفیف ویژهٔ جمعه سیاه فقط برای شما! کد: BF25',
      audienceSegment: 'all',
      audienceCount: 1240,
      sentAt: daysFrom(-14),
      deliveredCount: 1198,
      failedCount: 42,
      status: 'sent',
      createdAt: daysFrom(-15),
    },
    {
      id: 'cmp-2',
      name: 'یادآوری اشتراک VIP',
      message: 'قرارداد پشتیبانی شما تا ۳۰ روز آینده به سررسید می‌رسد.',
      audienceSegment: 'vip',
      audienceCount: 24,
      scheduledAt: daysFrom(3),
      deliveredCount: 0,
      failedCount: 0,
      status: 'scheduled',
      createdAt: daysFrom(-1),
    },
    {
      id: 'cmp-3',
      name: 'کمپین بازگشت مشتری',
      message: 'خیلی وقته سر نزدی! ۱۰٪ تخفیف با کد WELCOME_BACK.',
      audienceSegment: 'at_risk',
      audienceCount: 68,
      deliveredCount: 0,
      failedCount: 0,
      status: 'draft',
      createdAt: daysFrom(-2),
    },
  ]
}

export function createMockMarketingAdapter() {
  return {
    listCoupons(): Coupon[] {
      return safeRead<Coupon[]>(KEYS.coupons, couponsFallback())
    },
    saveCoupon(c: Coupon): Coupon[] {
      const all = this.listCoupons()
      const idx = all.findIndex((x) => x.id === c.id)
      const next = idx >= 0 ? [...all.slice(0, idx), c, ...all.slice(idx + 1)] : [...all, c]
      safeWrite(KEYS.coupons, next)
      return next
    },
    removeCoupon(id: string): Coupon[] {
      const next = this.listCoupons().filter((c) => c.id !== id)
      safeWrite(KEYS.coupons, next)
      return next
    },

    listCampaigns(): SmsCampaign[] {
      return safeRead<SmsCampaign[]>(KEYS.campaigns, campaignsFallback())
    },
    saveCampaign(c: SmsCampaign): SmsCampaign[] {
      const all = this.listCampaigns()
      const idx = all.findIndex((x) => x.id === c.id)
      const next = idx >= 0 ? [...all.slice(0, idx), c, ...all.slice(idx + 1)] : [...all, c]
      safeWrite(KEYS.campaigns, next)
      return next
    },
    removeCampaign(id: string): SmsCampaign[] {
      const next = this.listCampaigns().filter((c) => c.id !== id)
      safeWrite(KEYS.campaigns, next)
      return next
    },
  }
}

export type MarketingMockAdapter = ReturnType<typeof createMockMarketingAdapter>

/**
 * محاسبهٔ خودکار وضعیت کوپن از تاریخ و شمارش.
 * تنها منبع حقیقت برای تصمیم «قابل استفاده؟».
 */
export function deriveCouponStatus(c: Coupon, nowMs: number = Date.now()): Coupon['status'] {
  if (c.status === 'disabled') return 'disabled'
  const expiresMs = new Date(c.expiresAt).getTime()
  if (expiresMs < nowMs) return 'expired'
  if (c.usageLimit && c.usedCount >= c.usageLimit) return 'exhausted'
  const startsMs = new Date(c.startsAt).getTime()
  if (startsMs > nowMs) return 'disabled'
  return 'active'
}
