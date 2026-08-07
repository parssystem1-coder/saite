/**
 * قراردادهای دامنهٔ بازاریابی — کوپن و کمپین پیامکی.
 */

export type CouponKind = 'percent' | 'fixed'
export type CouponStatus = 'active' | 'expired' | 'exhausted' | 'disabled'

export interface Coupon {
  id: string
  code: string
  description?: string
  kind: CouponKind
  /** مقدار — درصد (۱–۱۰۰) یا مبلغ ثابت ریال */
  value: number
  /** حداقل مبلغ سبد برای اعمال */
  minCartValue?: number
  /** سقف تخفیف در حالت درصدی */
  maxDiscount?: number
  /** سقف کل استفاده */
  usageLimit?: number
  usedCount: number
  /** ISO */
  startsAt: string
  /** ISO */
  expiresAt: string
  /** slug های دسته/برند مجاز */
  restrictedCategories?: string[]
  status: CouponStatus
  createdAt: string
}

export type SmsCampaignStatus = 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed'

export interface SmsCampaign {
  id: string
  name: string
  message: string
  /** بخش‌های مخاطب: 'all' یا segment مشخص */
  audienceSegment: 'all' | 'vip' | 'repeat' | 'new' | 'at_risk'
  audienceCount: number
  /** ISO — زمان‌بندی ارسال */
  scheduledAt?: string
  sentAt?: string
  deliveredCount: number
  failedCount: number
  status: SmsCampaignStatus
  createdAt: string
}
