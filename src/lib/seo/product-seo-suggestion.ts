import { z } from 'zod'

/**
 * قرارداد ساخت‌یافتهٔ پیشنهاد سئوی محصول.
 *
 * این ماژول عمداً `server-only` نیست: هم Route Handler سرور و هم
 * پنل diff کلاینت باید یک اسکیما را ببینند. هیچ رازی اینجا نیست.
 *
 * قانون: فقط کلیدهای همین allowlist پذیرفته می‌شوند. کلید اضافه
 * با strip حذف می‌شود، طول بیش از سقف = رد کل فیلد.
 * قیمت، موجودی، گارانتی، GTIN و کد ایران اینجا نیستند.
 */

export const SEO_TITLE_MAX = 60
export const SEO_DESCRIPTION_MAX = 160
export const FOCUS_KEYWORD_MAX = 80
export const CANONICAL_URL_MAX = 500
export const FAQ_MIN = 2
export const FAQ_MAX = 5
export const FAQ_QUESTION_MAX = 160
export const FAQ_ANSWER_MAX = 400
export const PRODUCT_NAME_MAX = 200
export const PRODUCT_NAME_EN_MAX = 200
export const PRODUCT_SLUG_MAX = 80
export const PRODUCT_SKU_MAX = 40
export const SHORT_DESCRIPTION_MAX = 1000
export const LONG_DESCRIPTION_MAX = 20_000
export const ATTRIBUTE_MAX = 12
export const IMAGE_ALT_MAX = 160
export const IMAGE_ALT_COUNT_MAX = 12

export const SEO_SUGGESTION_KEYS = [
  'name',
  'nameEn',
  'slug',
  'sku',
  'series',
  'model',
  'category',
  'subCategory',
  'brand',
  'shortDescription',
  'longDescription',
  'seoTitle',
  'seoDescription',
  'focusKeyword',
  'canonicalUrl',
  'faqs',
  'attributes',
  'imageAlts',
] as const

export type SeoSuggestionKey = (typeof SEO_SUGGESTION_KEYS)[number]

const faqItemSchema = z.object({
  question: z.string().trim().min(1).max(FAQ_QUESTION_MAX),
  answer: z.string().trim().min(1).max(FAQ_ANSWER_MAX),
})

const attributeItemSchema = z.object({
  group: z.string().trim().min(1).max(80),
  name: z.string().trim().min(1).max(80),
  value: z.string().trim().min(1).max(120),
  unit: z.string().trim().max(24).optional().default(''),
})

/**
 * اسکیمای خروجی AI / فایل ایمپورت.
 * همهٔ فیلدها اختیاری‌اند تا «فقط فیلدهای خالی» زیرمجموعه برگرداند.
 * حداقل یک فیلد باید بعد از پارس باقی بماند (در لایهٔ generate چک می‌شود).
 */
export const productSeoSuggestionSchema = z
  .object({
    name: z.string().trim().min(1).max(PRODUCT_NAME_MAX).optional(),
    nameEn: z.string().trim().min(1).max(PRODUCT_NAME_EN_MAX).optional(),
    slug: z
      .string()
      .trim()
      .min(3)
      .max(PRODUCT_SLUG_MAX)
      .regex(/^[a-z0-9-]+$/, 'نامک فقط حروف انگلیسی، عدد و خط تیره')
      .optional(),
    sku: z
      .string()
      .trim()
      .min(3)
      .max(PRODUCT_SKU_MAX)
      .regex(/^[A-Za-z0-9-]+$/, 'SKU نامعتبر است')
      .optional(),
    series: z.string().trim().min(1).max(100).optional(),
    model: z.string().trim().min(1).max(100).optional(),
    category: z.string().trim().min(1).max(80).optional(),
    subCategory: z.string().trim().min(1).max(80).optional(),
    brand: z.string().trim().min(1).max(100).optional(),
    shortDescription: z.string().trim().min(1).max(SHORT_DESCRIPTION_MAX).optional(),
    longDescription: z.string().trim().min(1).max(LONG_DESCRIPTION_MAX).optional(),
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
    attributes: z.array(attributeItemSchema).min(1).max(ATTRIBUTE_MAX).optional(),
    imageAlts: z.array(z.string().trim().min(3).max(IMAGE_ALT_MAX)).min(1).max(IMAGE_ALT_COUNT_MAX).optional(),
  })
  .strict()

export type ProductSeoSuggestion = z.infer<typeof productSeoSuggestionSchema>

export type ProductSeoCurrentFields = {
  name: string
  nameEn: string
  slug: string
  sku: string
  series: string
  model: string
  category: string
  subCategory: string
  brand: string
  shortDescription: string
  longDescription: string
  seoTitle: string
  seoDescription: string
  focusKeyword: string
  canonicalUrl: string
  faqs: ReadonlyArray<{ question: string; answer: string }>
  attributes: ReadonlyArray<{ name: string; value: string }>
  imageAlts: ReadonlyArray<string>
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

export function emptyProductSeoCurrent(): ProductSeoCurrentFields {
  return {
    name: '',
    nameEn: '',
    slug: '',
    sku: '',
    series: '',
    model: '',
    category: '',
    subCategory: '',
    brand: '',
    shortDescription: '',
    longDescription: '',
    seoTitle: '',
    seoDescription: '',
    focusKeyword: '',
    canonicalUrl: '',
    faqs: [],
    attributes: [],
    imageAlts: [],
  }
}

export function isSeoFieldEmpty(key: SeoSuggestionKey, current: ProductSeoCurrentFields): boolean {
  switch (key) {
    case 'name':
      return current.name.trim().length === 0
    case 'nameEn':
      return current.nameEn.trim().length === 0
    case 'slug':
      return current.slug.trim().length === 0
    case 'sku':
      return current.sku.trim().length === 0
    case 'series':
      return current.series.trim().length === 0
    case 'model':
      return current.model.trim().length === 0
    case 'category':
      return current.category.trim().length === 0
    case 'subCategory':
      return current.subCategory.trim().length === 0
    case 'brand':
      return current.brand.trim().length === 0
    case 'shortDescription':
      return current.shortDescription.trim().length === 0
    case 'longDescription':
      return current.longDescription.trim().length === 0
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
    case 'attributes':
      return current.attributes.filter((item) => item.name.trim() && item.value.trim()).length === 0
    case 'imageAlts':
      return current.imageAlts.filter((item) => item.trim().length > 2).length === 0
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
  for (const key of SEO_SUGGESTION_KEYS) {
    if (suggestion[key] === undefined || !isSeoFieldEmpty(key, current)) continue
    if (key === 'faqs') next.faqs = suggestion.faqs
    else if (key === 'attributes') next.attributes = suggestion.attributes
    else if (key === 'imageAlts') next.imageAlts = suggestion.imageAlts
    else Object.assign(next, { [key]: suggestion[key] })
  }
  return next
}

export function suggestionHasContent(suggestion: ProductSeoSuggestion): boolean {
  return SEO_SUGGESTION_KEYS.some((key) => {
    if (key === 'faqs') return Boolean(suggestion.faqs && suggestion.faqs.length > 0)
    if (key === 'attributes') return Boolean(suggestion.attributes && suggestion.attributes.length > 0)
    if (key === 'imageAlts') return Boolean(suggestion.imageAlts && suggestion.imageAlts.length > 0)
    return suggestion[key] !== undefined
  })
}

export const SEO_FIELD_LABELS: Record<SeoSuggestionKey, string> = {
  name: 'نام فارسی',
  nameEn: 'نام انگلیسی',
  slug: 'نامک',
  sku: 'SKU',
  series: 'سری',
  model: 'مدل',
  category: 'دسته',
  subCategory: 'زیردسته',
  brand: 'برند',
  shortDescription: 'توضیح کوتاه',
  longDescription: 'توضیح کامل',
  seoTitle: 'عنوان سئو',
  seoDescription: 'توضیحات متا',
  focusKeyword: 'کلمهٔ کلیدی اصلی',
  canonicalUrl: 'Canonical URL',
  faqs: 'سوالات متداول',
  attributes: 'مشخصات فنی',
  imageAlts: 'متن جایگزین تصاویر',
}

/** حذف تگ برای رندر plain-text — هرگز HTML تفسیر نمی‌شود. */
export function stripMarkup(value: string): string {
  return value.replace(/<[^>]*>/g, '').replace(/&lt;|&gt;|&amp;/g, ' ').trim()
}

function sanitizeOptionalText(value: string | undefined): string | undefined {
  if (value === undefined) return undefined
  const cleaned = stripMarkup(value)
  return cleaned.length > 0 ? cleaned : undefined
}

/** پاکسازی متن پیشنهاد پس از zod — HTML تفسیر نمی‌شود. */
export function sanitizeProductSeoSuggestion(value: ProductSeoSuggestion): ProductSeoSuggestion {
  return {
    name: sanitizeOptionalText(value.name),
    nameEn: sanitizeOptionalText(value.nameEn),
    slug: sanitizeOptionalText(value.slug)?.toLowerCase(),
    sku: sanitizeOptionalText(value.sku)?.toUpperCase(),
    series: sanitizeOptionalText(value.series),
    model: sanitizeOptionalText(value.model),
    category: sanitizeOptionalText(value.category),
    subCategory: sanitizeOptionalText(value.subCategory),
    brand: sanitizeOptionalText(value.brand),
    shortDescription: sanitizeOptionalText(value.shortDescription),
    longDescription: sanitizeOptionalText(value.longDescription),
    seoTitle: sanitizeOptionalText(value.seoTitle),
    seoDescription: sanitizeOptionalText(value.seoDescription),
    focusKeyword: sanitizeOptionalText(value.focusKeyword),
    canonicalUrl: sanitizeOptionalText(value.canonicalUrl),
    faqs: value.faqs?.map((faq) => ({
      question: stripMarkup(faq.question),
      answer: stripMarkup(faq.answer),
    })),
    attributes: value.attributes?.map((item) => ({
      group: stripMarkup(item.group),
      name: stripMarkup(item.name),
      value: stripMarkup(item.value),
      unit: stripMarkup(item.unit ?? ''),
    })),
    imageAlts: value.imageAlts?.map((item) => stripMarkup(item)).filter((item) => item.length >= 3),
  }
}

export function hasProductSeoSeed(input: {
  name?: string
  brand?: string
  model?: string
  focusKeyword?: string
}): boolean {
  if ((input.name ?? '').trim()) return true
  if ((input.focusKeyword ?? '').trim()) return true
  return Boolean((input.brand ?? '').trim() && (input.model ?? '').trim())
}
