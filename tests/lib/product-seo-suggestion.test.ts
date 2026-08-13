import { describe, expect, it } from 'vitest'
import {
  emptyProductSeoCurrent,
  isSafeCanonicalUrl,
  listEmptySeoFields,
  pickEmptyOnlySuggestion,
  productSeoSuggestionSchema,
  sanitizeProductSeoSuggestion,
  suggestionHasContent,
} from '@/lib/seo/product-seo-suggestion'

const filled = {
  ...emptyProductSeoCurrent(),
  seoTitle: 'عنوان فعلی سئو برای محصول نمونه فروشگاهی',
  seoDescription: 'توضیح متای فعلی که به اندازه کافی بلند است تا خالی محسوب نشود و امتیاز را بسازد.',
  focusKeyword: 'پرینتر اچ پی',
  canonicalUrl: '/products/hp',
  faqs: [{ question: 'سوال؟', answer: 'جواب' }],
}

describe('productSeoSuggestionSchema', () => {
  it('کلید خارج از allowlist را رد می‌کند', () => {
    const result = productSeoSuggestionSchema.safeParse({
      seoTitle: 'عنوان سئوی مناسب برای محصول لیزری اداری سایت',
      extra: 'hack',
    })
    expect(result.success).toBe(false)
  })

  it('عنوان بلندتر از ۶۰ کاراکتر را رد می‌کند', () => {
    const result = productSeoSuggestionSchema.safeParse({
      seoTitle: 'الف'.repeat(61),
    })
    expect(result.success).toBe(false)
  })

  it('متای بلندتر از ۱۶۰ کاراکتر را رد می‌کند', () => {
    const result = productSeoSuggestionSchema.safeParse({
      seoDescription: 'ب'.repeat(161),
    })
    expect(result.success).toBe(false)
  })

  it('FAQ کمتر از ۲ مورد را رد می‌کند', () => {
    const result = productSeoSuggestionSchema.safeParse({
      faqs: [{ question: 'سوال', answer: 'جواب' }],
    })
    expect(result.success).toBe(false)
  })

  it('canonical ناامن را رد می‌کند', () => {
    expect(isSafeCanonicalUrl('javascript:alert(1)')).toBe(false)
    expect(isSafeCanonicalUrl('//evil.example')).toBe(false)
    expect(productSeoSuggestionSchema.safeParse({ canonicalUrl: 'javascript:alert(1)' }).success).toBe(
      false
    )
  })

  it('نمونهٔ معتبر را می‌پذیرد', () => {
    const result = productSeoSuggestionSchema.safeParse({
      seoTitle: 'پرینتر اچ پی M402 | خرید و قیمت روز',
      seoDescription:
        'خرید پرینتر اچ پی M402 با گارانتی اصالت کالا و مشاوره تخصصی در فروشگاه ماشین‌های اداری سایت. مشخصات و قیمت به‌روز.',
      focusKeyword: 'پرینتر اچ پی M402',
      faqs: [
        { question: 'گارانتی دارد؟', answer: 'بله، اصالت کالا تضمین می‌شود.' },
        { question: 'ارسال چند روزه است؟', answer: 'معمولاً یک روز کاری.' },
      ],
    })
    expect(result.success).toBe(true)
  })
})

describe('sanitizeProductSeoSuggestion', () => {
  it('تگ HTML را از پیشنهاد پاک می‌کند', () => {
    const cleaned = sanitizeProductSeoSuggestion({
      focusKeyword: '<iframe src="https://evil.test"></iframe>پرینتر اچ پی M402',
    })
    expect(cleaned.focusKeyword).toBe('پرینتر اچ پی M402')
    expect(cleaned.focusKeyword).not.toMatch(/iframe|<|>/)
  })
})

describe('emptyOnly helpers', () => {
  it('فیلدهای خالی را فهرست می‌کند', () => {
    const empty = listEmptySeoFields({
      ...emptyProductSeoCurrent(),
      focusKeyword: 'کلمه',
    })
    expect(empty).toContain('seoTitle')
    expect(empty).toContain('seoDescription')
    expect(empty).toContain('canonicalUrl')
    expect(empty).toContain('faqs')
    expect(empty).not.toContain('focusKeyword')
  })

  it('از پیشنهاد فقط فیلدهای خالی را نگه می‌دارد', () => {
    const picked = pickEmptyOnlySuggestion(
      {
        seoTitle: 'عنوان پیشنهادی مناسب برای سئوی محصول لیزری',
        focusKeyword: 'کلمه جدید',
      },
      filled
    )
    expect(picked.seoTitle).toBeUndefined()
    expect(picked.focusKeyword).toBeUndefined()
    expect(suggestionHasContent(picked)).toBe(false)
  })
})
