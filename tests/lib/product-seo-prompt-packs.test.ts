import { describe, expect, it } from 'vitest'
import {
  DEFAULT_PRODUCT_SEO_PACK_ID,
  getProductSeoPromptPack,
  isProductSeoPromptPackId,
  listProductSeoPromptPacks,
} from '@/lib/seo/product-seo-prompt-packs'

describe('product seo prompt packs', () => {
  it('بستهٔ پیش‌فرض و فهرست غیرخالی دارد', () => {
    expect(DEFAULT_PRODUCT_SEO_PACK_ID).toBe('product-seo.v1')
    expect(listProductSeoPromptPacks().length).toBeGreaterThanOrEqual(3)
    expect(isProductSeoPromptPackId('product-seo.commercial.v1')).toBe(true)
    expect(isProductSeoPromptPackId('unknown.v9')).toBe(false)
  })

  it('بستهٔ ناشناس را به پیش‌فرض برمی‌گرداند', () => {
    expect(getProductSeoPromptPack('nope').id).toBe(DEFAULT_PRODUCT_SEO_PACK_ID)
    expect(getProductSeoPromptPack('product-seo.faq.v1').extraRules).toMatch(/پرسش/)
  })
})
