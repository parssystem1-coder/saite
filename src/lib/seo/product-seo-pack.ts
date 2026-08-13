import {
  CANONICAL_URL_MAX,
  FAQ_ANSWER_MAX,
  FAQ_MAX,
  FAQ_MIN,
  FAQ_QUESTION_MAX,
  FOCUS_KEYWORD_MAX,
  SEO_DESCRIPTION_MAX,
  SEO_SUGGESTION_KEYS,
  SEO_TITLE_MAX,
  listEmptySeoFields,
  productSeoSuggestionSchema,
  sanitizeProductSeoSuggestion,
  suggestionHasContent,
  type ProductSeoCurrentFields,
  type ProductSeoSuggestion,
  type SeoSuggestionKey,
} from '@/lib/seo/product-seo-suggestion'
import {
  getProductSeoPromptPack,
  type ProductSeoPromptPackId,
} from '@/lib/seo/product-seo-prompt-packs'

export const PRODUCT_SEO_FILE_TYPE = 'saite.product-seo' as const
export const PRODUCT_SEO_SCHEMA_VERSION = 1 as const
/** سقف حجم متن خام فایل ایمپورت (نویسه). */
export const PRODUCT_SEO_IMPORT_MAX_CHARS = 64 * 1024

export const PRODUCT_SEO_TARGETS = {
  seoTitle: { min: 45, max: SEO_TITLE_MAX, required: true },
  seoDescription: { min: 110, max: SEO_DESCRIPTION_MAX, required: true },
  focusKeyword: { max: FOCUS_KEYWORD_MAX, required: true },
  canonicalUrl: { max: CANONICAL_URL_MAX, required: false },
  faqs: {
    min: FAQ_MIN,
    max: FAQ_MAX,
    questionMax: FAQ_QUESTION_MAX,
    answerMax: FAQ_ANSWER_MAX,
  },
} as const

const LONG_DESCRIPTION_MAX = 2500
const SPEC_ENTRY_MAX = 12

export type ProductSeoPackProduct = {
  name: string
  nameEn: string
  slug: string
  brand: string
  series: string
  model: string
  category: string
  shortDescription: string
  longDescription: string
  specs: string
  seoTitle: string
  seoDescription: string
  focusKeyword: string
  canonicalUrl: string
  faqs: Array<{ question: string; answer: string }>
}

export type ProductSeoPack = {
  fileType: typeof PRODUCT_SEO_FILE_TYPE
  schemaVersion: typeof PRODUCT_SEO_SCHEMA_VERSION
  exportedAt: string
  product: ProductSeoPackProduct
  targets: typeof PRODUCT_SEO_TARGETS
  emptyOnly: boolean
  emptyFields: SeoSuggestionKey[]
  promptPackId: ProductSeoPromptPackId
  instructionsText: string
  expectedResponse: {
    fileType: typeof PRODUCT_SEO_FILE_TYPE
    schemaVersion: typeof PRODUCT_SEO_SCHEMA_VERSION
    suggestion: {
      seoTitle: string
      seoDescription: string
      focusKeyword: string
      canonicalUrl: string
      faqs: Array<{ question: string; answer: string }>
    }
  }
}

export type ProductSeoPackInput = {
  name: string
  nameEn?: string
  slug?: string
  brand?: string
  series?: string
  model?: string
  category?: string
  shortDescription?: string
  longDescription?: string
  specs?: unknown
  current: ProductSeoCurrentFields
  emptyOnly: boolean
  promptPackId?: string
  keywordHints?: string[]
}

export type SeoPackParseResult<T> =
  | { ok: true; value: T }
  | { ok: false; message: string }

export const SEO_PACK_ERRORS = {
  empty: 'فایل خالی است.',
  tooLarge: 'حجم فایل بیش از ۶۴ کیلوبایت است.',
  notJson: 'فایل JSON معتبر نیست.',
  notObject: 'فایل باید یک شیء JSON باشد.',
  fileType: 'fileType نامعتبر است. فقط saite.product-seo پذیرفته می‌شود.',
  schemaVersion: 'schemaVersion الزامی است و فعلاً فقط نسخهٔ ۱ پذیرفته می‌شود.',
  noSuggestion:
    'این فایل پیشنهاد سئو ندارد. خروجی مدل را با کلید suggestion برگردانید؛ فایل خام اکسپورت را دوباره ایمپورت نکنید.',
  suggestionShape: 'پیشنهاد سئو با قرارداد فیلدها هم‌خوان نیست. کلید غیرمجاز یا طول بیش از سقف است.',
  suggestionEmpty: 'پس از پاکسازی، پیشنهادی برای اعمال باقی نماند.',
} as const

const PACK_ROOT_KNOWN = new Set<string>([
  'fileType',
  'schemaVersion',
  'exportedAt',
  'product',
  'targets',
  'emptyOnly',
  'emptyFields',
  'instructionsText',
  'expectedResponse',
  'promptPackId',
  'keywordHints',
  'suggestion',
  'result',
  ...SEO_SUGGESTION_KEYS,
])

export function summarizeProductSpecs(specs: unknown, maxEntries = SPEC_ENTRY_MAX): string {
  if (!specs || typeof specs !== 'object') return ''
  const entries = Object.entries(specs as Record<string, unknown>)
    .filter(([, value]) => value !== undefined && value !== null && String(value).trim() !== '')
    .slice(0, maxEntries)
    .map(([key, value]) => `${key}: ${String(value).slice(0, 80)}`)
  return entries.join('؛ ')
}

export function buildProductSeoInstructions(input: ProductSeoPackInput): string {
  const pack = getProductSeoPromptPack(input.promptPackId)
  const emptyFields = listEmptySeoFields(input.current)
  const emptyHint =
    input.emptyOnly && emptyFields.length > 0
      ? `فقط همین فیلدهای خالی را پر کن و بقیه را در suggestion نگذار: ${emptyFields.join('، ')}.`
      : input.emptyOnly
        ? 'emptyOnly روشن است و فیلد خالی نیست — suggestion را خالی نگذار؛ اگر چیزی برای بهبود نیست فایل را برنگردان.'
        : 'می‌توانی همهٔ فیلدهای allowlist را پیشنهاد بدهی. مقادیر فعلی فقط راهنما هستند.'

  const productLines = [
    `نام: ${input.name.trim() || '—'}`,
    `نام انگلیسی: ${(input.nameEn ?? '').trim() || '—'}`,
    `اسلاگ: ${(input.slug ?? '').trim() || '—'}`,
    `برند: ${(input.brand ?? '').trim() || '—'}`,
    `سری: ${(input.series ?? '').trim() || '—'}`,
    `مدل: ${(input.model ?? '').trim() || '—'}`,
    `دسته: ${(input.category ?? '').trim() || '—'}`,
    `توضیح کوتاه: ${(input.shortDescription ?? '').trim() || '—'}`,
    `توضیح بلند: ${(input.longDescription ?? '').trim().slice(0, LONG_DESCRIPTION_MAX) || '—'}`,
    `مشخصات: ${summarizeProductSpecs(input.specs) || '—'}`,
    `عنوان سئوی فعلی: ${input.current.seoTitle.trim() || '(خالی)'}`,
    `توضیح متای فعلی: ${input.current.seoDescription.trim() || '(خالی)'}`,
    `کلمهٔ کلیدی فعلی: ${input.current.focusKeyword.trim() || '(خالی)'}`,
    `canonical فعلی: ${input.current.canonicalUrl.trim() || '(خالی)'}`,
    `FAQ فعلی: ${
      input.current.faqs.length > 0
        ? input.current.faqs.map((faq) => `${faq.question} → ${faq.answer}`).join(' | ')
        : '(خالی)'
    }`,
  ]

  return [
    'تو دستیار سئوی فروشگاه فارسی «سایت» هستی (ماشین‌های اداری، چاپ و پرینتر).',
    'فقط یک شیء JSON برگردان؛ بدون توضیح اضافه، بدون markdown، بدون HTML و بدون iframe.',
    'شکل الزامی پاسخ:',
    JSON.stringify(
      {
        fileType: PRODUCT_SEO_FILE_TYPE,
        schemaVersion: PRODUCT_SEO_SCHEMA_VERSION,
        suggestion: {
          seoTitle: '۴۵ تا ۶۰ نویسه، نام کالا + خرید/قیمت',
          seoDescription: '۱۱۰ تا ۱۶۰ نویسه، فایده و اعتماد',
          focusKeyword: 'حداکثر ۸۰ نویسه',
          canonicalUrl: 'اختیاری؛ مسیر نسبی یا https همین فروشگاه',
          faqs: [{ question: 'سؤال کوتاه', answer: 'جواب کوتاه' }],
        },
      },
      null,
      2
    ),
    'سقف‌ها:',
    `- seoTitle: ۴۵ تا ${SEO_TITLE_MAX} نویسه`,
    `- seoDescription: ۱۱۰ تا ${SEO_DESCRIPTION_MAX} نویسه`,
    `- focusKeyword: حداکثر ${FOCUS_KEYWORD_MAX} نویسه`,
    `- canonicalUrl: حداکثر ${CANONICAL_URL_MAX} نویسه؛ javascript: و data: ممنوع`,
    `- faqs: ${FAQ_MIN} تا ${FAQ_MAX} مورد؛ سؤال ≤${FAQ_QUESTION_MAX}؛ جواب ≤${FAQ_ANSWER_MAX}`,
    'قواعد محتوا: فارسی معیار، بدون اغراق پزشکی/درمانی، بدون لینک خارجی، بدون تگ HTML.',
    'کلید خارج از suggestion ممنوع است (مثلاً description یا price ننویس).',
    pack.extraRules ? `بستهٔ پرامپت (${pack.id}): ${pack.extraRules}` : `بستهٔ پرامپت: ${pack.id}`,
    input.keywordHints && input.keywordHints.length > 0
      ? `کلمات مرتبط پیشنهادی ابزار سئو (فقط راهنما): ${input.keywordHints.join('، ')}`
      : '',
    emptyHint,
    'دادهٔ محصول:',
    ...productLines,
  ]
    .filter(Boolean)
    .join('\n')
}

export function buildProductSeoPack(
  input: ProductSeoPackInput,
  now: Date = new Date()
): ProductSeoPack {
  const emptyFields = listEmptySeoFields(input.current)
  return {
    fileType: PRODUCT_SEO_FILE_TYPE,
    schemaVersion: PRODUCT_SEO_SCHEMA_VERSION,
    exportedAt: now.toISOString(),
    product: {
      name: input.name.trim(),
      nameEn: (input.nameEn ?? '').trim(),
      slug: (input.slug ?? '').trim(),
      brand: (input.brand ?? '').trim(),
      series: (input.series ?? '').trim(),
      model: (input.model ?? '').trim(),
      category: (input.category ?? '').trim(),
      shortDescription: (input.shortDescription ?? '').trim(),
      longDescription: (input.longDescription ?? '').trim().slice(0, LONG_DESCRIPTION_MAX),
      specs: summarizeProductSpecs(input.specs),
      seoTitle: input.current.seoTitle.trim(),
      seoDescription: input.current.seoDescription.trim(),
      focusKeyword: input.current.focusKeyword.trim(),
      canonicalUrl: input.current.canonicalUrl.trim(),
      faqs: input.current.faqs.map((faq) => ({
        question: faq.question.trim(),
        answer: faq.answer.trim(),
      })),
    },
    targets: PRODUCT_SEO_TARGETS,
    emptyOnly: input.emptyOnly,
    emptyFields,
    promptPackId: getProductSeoPromptPack(input.promptPackId).id,
    instructionsText: buildProductSeoInstructions(input),
    expectedResponse: {
      fileType: PRODUCT_SEO_FILE_TYPE,
      schemaVersion: PRODUCT_SEO_SCHEMA_VERSION,
      suggestion: {
        seoTitle: '',
        seoDescription: '',
        focusKeyword: '',
        canonicalUrl: '',
        faqs: [{ question: '', answer: '' }],
      },
    },
  }
}

export function productSeoPackFilename(slug: string): string {
  const safe = slug
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
  return `saite-product-seo${safe ? `-${safe}` : ''}.json`
}

export function tryExtractJsonObject(rawText: string): SeoPackParseResult<unknown> {
  const trimmed = rawText.trim()
  if (!trimmed) {
    return { ok: false, message: SEO_PACK_ERRORS.empty }
  }

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const candidate = (fenced?.[1] ?? trimmed).trim()
  const start = candidate.indexOf('{')
  const end = candidate.lastIndexOf('}')
  if (start === -1 || end <= start) {
    return { ok: false, message: SEO_PACK_ERRORS.notJson }
  }

  try {
    return { ok: true, value: JSON.parse(candidate.slice(start, end + 1)) as unknown }
  } catch {
    return { ok: false, message: SEO_PACK_ERRORS.notJson }
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function hasAnySuggestionKey(value: Record<string, unknown>): boolean {
  return SEO_SUGGESTION_KEYS.some((key) => value[key] !== undefined)
}

function pickSuggestionPayload(pack: Record<string, unknown>): unknown | null {
  if (isPlainObject(pack.suggestion) && hasAnySuggestionKey(pack.suggestion)) {
    return pack.suggestion
  }
  if (isPlainObject(pack.result) && hasAnySuggestionKey(pack.result)) {
    return pack.result
  }
  if (hasAnySuggestionKey(pack)) {
    const picked: Record<string, unknown> = {}
    for (const key of SEO_SUGGESTION_KEYS) {
      if (pack[key] !== undefined) picked[key] = pack[key]
    }
    return picked
  }
  return null
}

/**
 * پارس سخت‌گیرانهٔ فایل ایمپورت.
 * HTML تفسیر نمی‌شود؛ فقط JSON متنی + allowlist فیلدهای سئو.
 */
export function parseProductSeoImport(rawText: string): SeoPackParseResult<ProductSeoSuggestion> {
  if (rawText.length > PRODUCT_SEO_IMPORT_MAX_CHARS) {
    return { ok: false, message: SEO_PACK_ERRORS.tooLarge }
  }

  const extracted = tryExtractJsonObject(rawText)
  if (!extracted.ok) return extracted
  if (!isPlainObject(extracted.value)) {
    return { ok: false, message: SEO_PACK_ERRORS.notObject }
  }

  const pack: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(extracted.value)) {
    if (PACK_ROOT_KNOWN.has(key)) pack[key] = value
  }

  if (pack.fileType !== PRODUCT_SEO_FILE_TYPE) {
    return { ok: false, message: SEO_PACK_ERRORS.fileType }
  }
  if (pack.schemaVersion !== PRODUCT_SEO_SCHEMA_VERSION) {
    return { ok: false, message: SEO_PACK_ERRORS.schemaVersion }
  }

  const payload = pickSuggestionPayload(pack)
  if (!payload) {
    return { ok: false, message: SEO_PACK_ERRORS.noSuggestion }
  }

  const parsed = productSeoSuggestionSchema.safeParse(payload)
  if (!parsed.success) {
    return { ok: false, message: SEO_PACK_ERRORS.suggestionShape }
  }

  const sanitized = sanitizeProductSeoSuggestion(parsed.data)
  const again = productSeoSuggestionSchema.safeParse(sanitized)
  if (!again.success) {
    return { ok: false, message: SEO_PACK_ERRORS.suggestionShape }
  }

  if (!suggestionHasContent(again.data)) {
    return { ok: false, message: SEO_PACK_ERRORS.suggestionEmpty }
  }

  return { ok: true, value: again.data }
}
