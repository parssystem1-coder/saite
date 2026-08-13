import 'server-only'
import { z } from 'zod'
import { ValidationError } from '@/server/shared/errors'
import { tryExtractJsonObject } from '@/lib/seo/product-seo-pack'
import {
  productSeoSuggestionSchema,
  sanitizeProductSeoSuggestion,
  type ProductSeoSuggestion,
} from '@/lib/seo/product-seo-suggestion'

export const PRODUCT_SEO_PARSE_ERROR =
  'خروجی هوش مصنوعی قابل‌خواندن نیست. لطفاً دوباره تلاش کنید.'

/**
 * جدا کردن اولین شیء JSON از متن مدل (با یا بدون فنس markdown).
 * JSON خراب = خطا؛ هرگز حدس نمی‌زنیم.
 */
export function extractJsonObject(rawText: string): unknown {
  const extracted = tryExtractJsonObject(rawText)
  if (!extracted.ok) {
    throw new ValidationError({ seo: PRODUCT_SEO_PARSE_ERROR }, PRODUCT_SEO_PARSE_ERROR)
  }
  return extracted.value
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

  const sanitized = sanitizeProductSeoSuggestion(result.data)
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
