import 'server-only'
import { z } from 'zod'
import { ValidationError } from '@/server/shared/errors'
import {
  productSeoSuggestionSchema,
  stripMarkup,
  type ProductSeoSuggestion,
} from '@/lib/seo/product-seo-suggestion'

export const PRODUCT_SEO_PARSE_ERROR =
  'خروجی هوش مصنوعی قابل‌خواندن نیست. لطفاً دوباره تلاش کنید.'

/**
 * جدا کردن اولین شیء JSON از متن مدل (با یا بدون فنس markdown).
 * JSON خراب = خطا؛ هرگز حدس نمی‌زنیم.
 */
export function extractJsonObject(rawText: string): unknown {
  const trimmed = rawText.trim()
  if (!trimmed) {
    throw new ValidationError({ seo: PRODUCT_SEO_PARSE_ERROR }, PRODUCT_SEO_PARSE_ERROR)
  }

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const candidate = (fenced?.[1] ?? trimmed).trim()
  const start = candidate.indexOf('{')
  const end = candidate.lastIndexOf('}')
  if (start === -1 || end <= start) {
    throw new ValidationError({ seo: PRODUCT_SEO_PARSE_ERROR }, PRODUCT_SEO_PARSE_ERROR)
  }

  try {
    return JSON.parse(candidate.slice(start, end + 1)) as unknown
  } catch {
    throw new ValidationError({ seo: PRODUCT_SEO_PARSE_ERROR }, PRODUCT_SEO_PARSE_ERROR)
  }
}

function sanitizeSuggestion(value: ProductSeoSuggestion): ProductSeoSuggestion {
  return {
    seoTitle: value.seoTitle !== undefined ? stripMarkup(value.seoTitle) : undefined,
    seoDescription:
      value.seoDescription !== undefined ? stripMarkup(value.seoDescription) : undefined,
    focusKeyword: value.focusKeyword !== undefined ? stripMarkup(value.focusKeyword) : undefined,
    canonicalUrl: value.canonicalUrl !== undefined ? stripMarkup(value.canonicalUrl) : undefined,
    faqs: value.faqs?.map((faq) => ({
      question: stripMarkup(faq.question),
      answer: stripMarkup(faq.answer),
    })),
  }
}

/**
 * پارس + اعتبارسنجی سخت‌گیرانهٔ خروجی مدل.
 * کلید خارج از allowlist رد می‌شود (.strict). طول بیش از سقف = خطا.
 */
export function parseProductSeoOutput(rawText: string): ProductSeoSuggestion {
  const parsed = extractJsonObject(rawText)
  const result = productSeoSuggestionSchema.safeParse(parsed)
  if (!result.success) {
    throw new ValidationError(
      result.error.flatten(),
      'خروجی هوش مصنوعی با قرارداد سئو هم‌خوان نیست. دوباره تلاش کنید.'
    )
  }

  const sanitized = sanitizeSuggestion(result.data)
  const again = productSeoSuggestionSchema.safeParse(sanitized)
  if (!again.success) {
    throw new ValidationError(
      again.error.flatten(),
      'خروجی هوش مصنوعی پس از پاکسازی نامعتبر شد. دوباره تلاش کنید.'
    )
  }
  return again.data
}

export function isZodError(err: unknown): err is z.ZodError {
  return err instanceof z.ZodError
}
