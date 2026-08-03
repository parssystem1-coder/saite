import { describe, expect, it } from 'vitest'
import { toCompatibleItemSummary, toProductCardData } from '@/types/product'
import { makeProduct } from '../fixtures/product'

/**
 * این تست‌ها «قرارداد مرز سرور→کلاینت» را قفل می‌کنند.
 *
 * اندازه‌گیری روی بیلد نشان داد صفحهٔ اصلی Product کامل را سریال
 * می‌کرد و specs/reviews/faqs وارد payload می‌شدند. اگر روزی کسی
 * فیلدی به این توابع اضافه کند، این تست‌ها هشدار می‌دهند.
 */

/** فیلدهایی که هرگز نباید به کلاینت برسند مگر واقعاً لازم باشند */
const HEAVY_FIELDS = [
  'specs',
  'reviews',
  'faqs',
  'description',
  'shortDescription',
  'createdAt',
  'datasheetUrl',
  'compatibleWith',
  'consumables',
] as const

describe('toProductCardData', () => {
  it('فیلدهای سنگین را حذف می‌کند', () => {
    const card = toProductCardData(makeProduct()) as Record<string, unknown>
    for (const field of HEAVY_FIELDS) {
      expect(card, `${field} نباید در دادهٔ کارت باشد`).not.toHaveProperty(field)
    }
  })

  it('هر آنچه کارت نمایش می‌دهد را نگه می‌دارد', () => {
    const product = makeProduct()
    const card = toProductCardData(product)
    expect(card.id).toBe(product.id)
    expect(card.slug).toBe(product.slug)
    expect(card.model).toBe(product.model)
    expect(card.images).toEqual(product.images)
    expect(card.keyFeatures).toEqual(product.keyFeatures)
    expect(card.stockStatus).toBe(product.stockStatus)
    expect(card.priceType).toBe(product.priceType)
    expect(card.condition).toBe(product.condition)
  })

  it('دقیقاً ۱۳ کلید دارد — رشد ناخواسته گرفته می‌شود', () => {
    expect(Object.keys(toProductCardData(makeProduct()))).toHaveLength(13)
  })

  it('کالای استعلامی بدون قیمت هم درست تبدیل می‌شود', () => {
    const card = toProductCardData(makeProduct({ priceType: 'quote_only', price: undefined }))
    expect(card.priceType).toBe('quote_only')
    expect(card.price).toBeUndefined()
  })
})

describe('toCompatibleItemSummary', () => {
  it('فیلدهای سنگین و حتی images را حذف می‌کند', () => {
    const summary = toCompatibleItemSummary(makeProduct()) as Record<string, unknown>
    for (const field of HEAVY_FIELDS) {
      expect(summary).not.toHaveProperty(field)
    }
    // ویجت سازگاری تصویر نشان نمی‌دهد
    expect(summary).not.toHaveProperty('images')
    expect(summary).not.toHaveProperty('keyFeatures')
  })

  it('دقیقاً ۸ کلید لازم ویجت را دارد', () => {
    const summary = toCompatibleItemSummary(makeProduct())
    expect(Object.keys(summary).sort()).toEqual(
      ['brand', 'id', 'model', 'name', 'price', 'priceType', 'slug', 'stockStatus'].sort()
    )
  })

  it('از دادهٔ کارت سبک‌تر است', () => {
    const product = makeProduct()
    const cardSize = JSON.stringify(toProductCardData(product)).length
    const summarySize = JSON.stringify(toCompatibleItemSummary(product)).length
    expect(summarySize).toBeLessThan(cardSize)
  })
})
