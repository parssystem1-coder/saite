import { describe, expect, it } from 'vitest'
import {
  renderProductSeoPrompt,
  renderProductSeoPromptByPack,
  resolveProductSeoPromptPackId,
  toProductSeoPromptVars,
} from '@/server/ai/features/product-seo/prompt'
import { ValidationError } from '@/server/shared/errors'

const vars = toProductSeoPromptVars({
  productName: 'پرینتر اچ پی M402',
  emptyOnly: true,
  emptyFields: 'seoTitle',
})

describe('product seo prompt packs render', () => {
  it('بستهٔ پیش‌فرض همان متن v1 است', () => {
    expect(renderProductSeoPromptByPack('product-seo.v1', vars)).toBe(renderProductSeoPrompt(vars))
    expect(renderProductSeoPromptByPack(undefined, vars)).toBe(renderProductSeoPrompt(vars))
  })

  it('بستهٔ سازمانی قاعدهٔ B2B را اضافه می‌کند', () => {
    const text = renderProductSeoPromptByPack('product-seo.commercial.v1', vars)
    expect(text).toContain('سازمانی')
    expect(text).toContain('allowlist')
  })

  it('راهنمای کلمهٔ کلیدی را فقط وقتی هست اضافه می‌کند', () => {
    const withHints = renderProductSeoPromptByPack('product-seo.v1', {
      ...vars,
      keywordHints: 'خرید پرینتر، قیمت پرینتر',
    })
    expect(withHints).toContain('خرید پرینتر')
    expect(withHints).toContain('عدد حجم/سختی')
  })

  it('شناسهٔ نامعتبر را رد می‌کند', () => {
    expect(() => resolveProductSeoPromptPackId('evil.v1')).toThrow(ValidationError)
  })
})
