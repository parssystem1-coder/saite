import { z } from 'zod'

/**
 * قرارداد ساخت‌یافتهٔ پیشنهاد سئوی محصول.
 *
 * این ماژول عمداً `server-only` نیست: هم Route Handler سرور و هم
 * پنل diff کلاینت باید یک اسکیما را ببینند. هیچ رازی اینجا نیست.
 *
 * قانون: فقط کلیدهای همین allowlist پذیرفته می‌شوند. کلید اضافه
 * با strip حذف می‌شود، طول بیش از سقف = رد کل فیلد.
 */

export const SEO_TITLE_MAX = 60
export const SEO_DESCRIPTION_MAX = 160
export const FOCUS_KEYWORD_MAX = 80
export const CANONICAL_URL_MAX = 500
export const FAQ_MIN = 2
export const FAQ_MAX = 5
export const FAQ_QUESTION_MAX = 160
export const FAQ_ANSWER_MAX = 400

export const SEO_SUGGESTION_KEYS = [
  'seoTitle',
  'seoDescription',
  'focusKeyword',
  'canonicalUrl',
  'faqs',
] as const

export type SeoSuggestionKey = (typeof SEO_SUGGESTION_KEYS)[number]

const faqItemSchema = z.object({
  question: z.string().trim().min(1).max(FAQ_QUESTION_MAX),
  answer: z.string().trim().min(1).max(FAQ_ANSWER_MAX),
})

/**
 * اسکیمای خروجی AI / فایل ایمپورت.
 * همهٔ فیلدها اختیاری‌اند تا «فقط فیلدهای خالی» زیرمجموعه برگرداند.
 * حداقل یک فیلد باید بعد از پارس باقی بماند (در لایهٔ generate چک می‌شود).
 */
export const productSeoSuggestionSchema = z
  .object({
    seoTitle: z.string().trim().min(1).max(SEO_TITLE_MAX).optional(),
    seoDescription: z.string().trim().min(1).max(SEO_DESCRIPTION_MAX).optional(),
    focusKeyword: z.string().trim().min(1).max(FOCUS_KEYWORD_MAX).optional(),
    canonicalUrl: z
      .string()
      .trim()
      .max(CANONICAL_URL_MAX)
      .refine(isSafeCanonicalUrl, 'نشانی canonical نامعتبر است')
      .optional(),
    faqs: z.array(faqItemSchema).min(FAQ_MIN).max(FAQ_MAX).optional(),
  })
  .strict()

export type ProductSeoSuggestion = z.infer<typeof productSeoSuggestionSchema>

export type ProductSeoCurrentFields = {
  seoTitle: string
  seoDescription: string
  focusKeyword: string
  canonicalUrl: string
  faqs: ReadonlyArray<{ question: string; answer: string }>
}

/** نشانی canonical: خالی، مسیر داخلی، یا http(s). نه javascript: و نه //. */
export function isSafeCanonicalUrl(value: string): boolean {
  const trimmed = value.trim()
  if (trimmed.length === 0) return true
  if (trimmed.startsWith('//')) return false
  if (trimmed.startsWith('/')) return !trimmed.includes('://')
  try {
    const url = new URL(trimmed)
    return url.protocol === 'https:' || url.protocol === 'http:'
  } catch {
    return false
  }
}

export function isCompleteFaq(faq: { question: string; answer: string }): boolean {
  return faq.question.trim().length > 0 && faq.answer.trim().length > 0
}

export function isSeoFieldEmpty(
  key: SeoSuggestionKey,
  current: ProductSeoCurrentFields
): boolean {
  switch (key) {
    case 'seoTitle':
      return current.seoTitle.trim().length === 0
    case 'seoDescription':
      return current.seoDescription.trim().length === 0
    case 'focusKeyword':
      return current.focusKeyword.trim().length === 0
    case 'canonicalUrl':
      return current.canonicalUrl.trim().length === 0
    case 'faqs':
      return current.faqs.filter(isCompleteFaq).length === 0
  }
}

export function listEmptySeoFields(current: ProductSeoCurrentFields): SeoSuggestionKey[] {
  return SEO_SUGGESTION_KEYS.filter((key) => isSeoFieldEmpty(key, current))
}

/** فقط کلیدهای خالی را نگه می‌دارد — دفاع در عمق برای emptyOnly. */
export function pickEmptyOnlySuggestion(
  suggestion: ProductSeoSuggestion,
  current: ProductSeoCurrentFields
): ProductSeoSuggestion {
  const next: ProductSeoSuggestion = {}
  if (suggestion.seoTitle !== undefined && isSeoFieldEmpty('seoTitle', current)) {
    next.seoTitle = suggestion.seoTitle
  }
  if (suggestion.seoDescription !== undefined && isSeoFieldEmpty('seoDescription', current)) {
    next.seoDescription = suggestion.seoDescription
  }
  if (suggestion.focusKeyword !== undefined && isSeoFieldEmpty('focusKeyword', current)) {
    next.focusKeyword = suggestion.focusKeyword
  }
  if (suggestion.canonicalUrl !== undefined && isSeoFieldEmpty('canonicalUrl', current)) {
    next.canonicalUrl = suggestion.canonicalUrl
  }
  if (suggestion.faqs !== undefined && isSeoFieldEmpty('faqs', current)) {
    next.faqs = suggestion.faqs
  }
  return next
}

export function suggestionHasContent(suggestion: ProductSeoSuggestion): boolean {
  return (
    suggestion.seoTitle !== undefined ||
    suggestion.seoDescription !== undefined ||
    suggestion.focusKeyword !== undefined ||
    suggestion.canonicalUrl !== undefined ||
    (suggestion.faqs !== undefined && suggestion.faqs.length > 0)
  )
}

export const SEO_FIELD_LABELS: Record<SeoSuggestionKey, string> = {
  seoTitle: 'عنوان سئو',
  seoDescription: 'توضیحات متا',
  focusKeyword: 'کلمهٔ کلیدی اصلی',
  canonicalUrl: 'Canonical URL',
  faqs: 'سوالات متداول',
}

/** حذف تگ برای رندر plain-text — هرگز HTML تفسیر نمی‌شود. */
export function stripMarkup(value: string): string {
  return value.replace(/<[^>]*>/g, '').replace(/&lt;|&gt;|&amp;/g, ' ').trim()
}
