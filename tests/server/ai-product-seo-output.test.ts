import { describe, expect, it } from 'vitest'
import { extractJsonObject, parseProductSeoOutput } from '@/server/ai/features/product-seo/output'
import { ValidationError } from '@/server/shared/errors'

const valid = {
  seoTitle: 'پرینتر اچ پی M402 | خرید و قیمت روز',
  seoDescription:
    'خرید پرینتر اچ پی M402 با گارانتی اصالت کالا و مشاوره تخصصی در فروشگاه ماشین‌های اداری سایت. مشخصات فنی و قیمت به‌روز.',
  focusKeyword: 'پرینتر اچ پی M402',
  faqs: [
    { question: 'آیا گارانتی دارد؟', answer: 'بله، کالا با گارانتی اصالت عرضه می‌شود.' },
    { question: 'زمان ارسال چقدر است؟', answer: 'معمولاً یک روز کاری.' },
  ],
}

describe('parseProductSeoOutput', () => {
  it('JSON خام معتبر را می‌خواند', () => {
    const suggestion = parseProductSeoOutput(JSON.stringify(valid))
    expect(suggestion.seoTitle).toBe(valid.seoTitle)
    expect(suggestion.faqs).toHaveLength(2)
  })

  it('فنس markdown را جدا می‌کند', () => {
    const suggestion = parseProductSeoOutput(`این توضیح\n\`\`\`json\n${JSON.stringify(valid)}\n\`\`\``)
    expect(suggestion.focusKeyword).toBe(valid.focusKeyword)
  })

  it('تگ HTML را از متن پاک می‌کند', () => {
    const suggestion = parseProductSeoOutput(
      JSON.stringify({
        ...valid,
        seoTitle: 'پرینتر اچ پی M402 | خرید و قیمت روز',
        focusKeyword: '<b>پرینتر اچ پی M402</b>',
      })
    )
    expect(suggestion.focusKeyword).toBe('پرینتر اچ پی M402')
  })

  it('JSON خراب خطای فارسی می‌دهد', () => {
    expect(() => parseProductSeoOutput('این فقط متن است')).toThrow(ValidationError)
    expect(() => extractJsonObject('{not json')).toThrow(ValidationError)
  })

  it('کلید غیرمجاز را رد می‌کند', () => {
    expect(() =>
      parseProductSeoOutput(JSON.stringify({ ...valid, price: 1, description: 'نوشتن در DB' }))
    ).toThrow(ValidationError)
  })
})
