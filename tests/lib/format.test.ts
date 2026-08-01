import { describe, expect, it } from 'vitest'
import { calcDiscountPercent, formatPrice, formatWarranty } from '@/lib/format'

describe('formatPrice', () => {
  it('عدد را با ارقام فارسی و جداکنندهٔ هزارگان برمی‌گرداند', () => {
    expect(formatPrice(4850000)).toBe('۴٬۸۵۰٬۰۰۰')
  })

  it('صفر را درست نمایش می‌دهد', () => {
    expect(formatPrice(0)).toBe('۰')
  })
})

describe('calcDiscountPercent', () => {
  it('درصد تخفیف را گرد می‌کند', () => {
    expect(calcDiscountPercent(4850000, 5300000)).toBe(8)
  })

  it('اگر قیمت قبلی نباشد null برمی‌گرداند', () => {
    expect(calcDiscountPercent(1000)).toBeNull()
  })

  it('تخفیف ساختگی (قیمت قبلی کمتر یا مساوی) را رد می‌کند', () => {
    expect(calcDiscountPercent(1000, 900)).toBeNull()
    expect(calcDiscountPercent(1000, 1000)).toBeNull()
  })
})

describe('formatWarranty', () => {
  it('مضرب ۱۲ را به سال تبدیل می‌کند', () => {
    expect(formatWarranty(24)).toBe('۲ سال ضمانت')
  })

  it('غیرمضرب را به ماه نشان می‌دهد', () => {
    expect(formatWarranty(18)).toBe('۱۸ ماه ضمانت')
  })

  it('بدون مقدار، null برمی‌گرداند', () => {
    expect(formatWarranty()).toBeNull()
  })
})
