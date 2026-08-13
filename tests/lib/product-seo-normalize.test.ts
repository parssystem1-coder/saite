import { describe, expect, it } from 'vitest'
import {
  normalizeProductSeoSuggestion,
  resolveCatalogBrand,
  resolveCatalogCategory,
  toSafeSlug,
} from '@/lib/seo/product-seo-normalize'

describe('product seo normalize', () => {
  it('برند و دسته را به فهرست فروشگاه می‌چسباند', () => {
    expect(resolveCatalogBrand('hp')).toBe('HP')
    expect(resolveCatalogBrand('اچ‌پی')).toBe('HP')
    expect(resolveCatalogBrand('unknown-brand')).toBeUndefined()
    expect(resolveCatalogCategory('پرینتر')).toBe('printer')
    expect(resolveCatalogCategory('printer')).toBe('printer')
  })

  it('نامک ناامن را پاکسازی می‌کند', () => {
    expect(toSafeSlug('HP Laser/M402')).toBe('hp-laser-m402')
    expect(toSafeSlug('پرینتر')).toBeUndefined()
  })

  it('دستهٔ جعلی را از پیشنهاد حذف می‌کند', () => {
    const normalized = normalizeProductSeoSuggestion({
      seoTitle: 'پرینتر اچ پی M402 | خرید و قیمت روز',
      brand: 'hp',
      category: 'evil-category',
      slug: 'HP Laser M402',
    })
    expect(normalized.brand).toBe('HP')
    expect(normalized.category).toBeUndefined()
    expect(normalized.slug).toBe('hp-laser-m402')
  })
})
