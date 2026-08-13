import { BRANDS, CATEGORIES } from '@/lib/constants'
import {
  ATTRIBUTE_MAX,
  CANONICAL_URL_MAX,
  FAQ_ANSWER_MAX,
  FAQ_MAX,
  FAQ_MIN,
  FAQ_QUESTION_MAX,
  FOCUS_KEYWORD_MAX,
  LONG_DESCRIPTION_MAX,
  SEO_DESCRIPTION_MAX,
  SEO_SUGGESTION_KEYS,
  SEO_TITLE_MAX,
  SHORT_DESCRIPTION_MAX,
  currentFieldsToSuggestion,
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

const INSTRUCTION_LONG_DESCRIPTION_MAX = 2500
const SPEC_ENTRY_MAX = 12

/** این کلیدها هرگز در suggestion/product اکسپورت یا ایمپورت نمی‌آیند. */
export const PRODUCT_SEO_EXCLUDED_KEYS = [
  'price',
  'priceToman',
  'salePriceToman',
  'costToman',
  'stock',
  'warranty',
  'gtin',
  'barcode',
  'iranCode',
] as const

export type ProductSeoPackAttribute = {
  group: string
  name: string
  value: string
  unit: string
}

export type ProductSeoPackProduct = {
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
  faqs: Array<{ question: string; answer: string }>
  attributes: ProductSeoPackAttribute[]
  imageAlts: string[]
}

export const PRODUCT_SEO_EXPECTED_SUGGESTION = {
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
  faqs: [{ question: '', answer: '' }],
  attributes: [{ group: '', name: '', value: '', unit: '' }],
  imageAlts: [''],
} as const

export type ProductSeoPack = {
  fileType: typeof PRODUCT_SEO_FILE_TYPE
  schemaVersion: typeof PRODUCT_SEO_SCHEMA_VERSION
  exportedAt: string
  product: ProductSeoPackProduct
  targets: typeof PRODUCT_SEO_TARGETS
  emptyOnly: boolean
  emptyFields: SeoSuggestionKey[]
  allowlist: typeof SEO_SUGGESTION_KEYS
  promptPackId: ProductSeoPromptPackId
  instructionsText: string
  suggestion?: ProductSeoSuggestion
  expectedResponse: {
    fileType: typeof PRODUCT_SEO_FILE_TYPE
    schemaVersion: typeof PRODUCT_SEO_SCHEMA_VERSION
    suggestion: typeof PRODUCT_SEO_EXPECTED_SUGGESTION
  }
}

export type ProductSeoPackInput = {
  name: string
  nameEn?: string
  slug?: string
  sku?: string
  brand?: string
  series?: string
  model?: string
  category?: string
  subCategory?: string
  shortDescription?: string
  longDescription?: string
  specs?: unknown
  current: Partial<ProductSeoCurrentFields>
  emptyOnly: boolean
  promptPackId?: string
  keywordHints?: string[]
  imageCount?: number
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
    'این فایل پیشنهاد سئو ندارد. خروجی مدل را با کلید suggestion برگردانید، یا محصول پرشده را دوباره دانلود کنید.',
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

function firstNonEmpty(...values: Array<string | undefined>): string {
  for (const value of values) {
    if (value && value.trim()) return value.trim()
  }
  return ''
}

function resolvePackCurrent(input: ProductSeoPackInput): ProductSeoCurrentFields {
  const current = input.current ?? {}
  return {
    name: firstNonEmpty(current.name, input.name),
    nameEn: firstNonEmpty(current.nameEn, input.nameEn),
    slug: firstNonEmpty(current.slug, input.slug),
    sku: firstNonEmpty(current.sku, input.sku),
    series: firstNonEmpty(current.series, input.series),
    model: firstNonEmpty(current.model, input.model),
    category: firstNonEmpty(current.category, input.category),
    subCategory: firstNonEmpty(current.subCategory, input.subCategory),
    brand: firstNonEmpty(current.brand, input.brand),
    shortDescription: firstNonEmpty(current.shortDescription, input.shortDescription),
    longDescription: firstNonEmpty(current.longDescription, input.longDescription).slice(
      0,
      LONG_DESCRIPTION_MAX
    ),
    seoTitle: (current.seoTitle ?? '').trim(),
    seoDescription: (current.seoDescription ?? '').trim(),
    focusKeyword: (current.focusKeyword ?? '').trim(),
    canonicalUrl: (current.canonicalUrl ?? '').trim(),
    faqs: current.faqs ?? [],
    attributes: current.attributes ?? [],
    imageAlts: current.imageAlts ?? [],
  }
}

function snapshotPackProduct(current: ProductSeoCurrentFields): ProductSeoPackProduct {
  return {
    name: current.name,
    nameEn: current.nameEn,
    slug: current.slug,
    sku: current.sku,
    series: current.series,
    model: current.model,
    category: current.category,
    subCategory: current.subCategory,
    brand: current.brand,
    shortDescription: current.shortDescription,
    longDescription: current.longDescription,
    seoTitle: current.seoTitle,
    seoDescription: current.seoDescription,
    focusKeyword: current.focusKeyword,
    canonicalUrl: current.canonicalUrl,
    faqs: current.faqs.map((faq) => ({
      question: faq.question.trim(),
      answer: faq.answer.trim(),
    })),
    attributes: current.attributes
      .filter((item) => item.name.trim() && item.value.trim())
      .slice(0, ATTRIBUTE_MAX)
      .map((item) => ({
        group: (item.group ?? '').trim() || 'عمومی',
        name: item.name.trim(),
        value: item.value.trim(),
        unit: (item.unit ?? '').trim(),
      })),
    imageAlts: current.imageAlts.map((item) => item.trim()).filter(Boolean),
  }
}

export function buildProductSeoInstructions(input: ProductSeoPackInput): string {
  const pack = getProductSeoPromptPack(input.promptPackId)
  const resolvedCurrent = resolvePackCurrent(input)
  const emptyFields = listEmptySeoFields(resolvedCurrent)
  const imageCount = input.imageCount ?? resolvedCurrent.imageAlts.length
  const emptyHint =
    input.emptyOnly && emptyFields.length > 0
      ? `فقط همین فیلدهای خالی را پر کن و بقیه را در suggestion نگذار: ${emptyFields.join('، ')}.`
      : input.emptyOnly
        ? 'emptyOnly روشن است و فیلد خالی نیست — suggestion را خالی نگذار؛ اگر چیزی برای بهبود نیست فایل را برنگردان.'
        : 'برای محصول جدید همهٔ فیلدهای allowlist را مثل «تکمیل حرفه‌ای محصول» پر کن. مقادیر فعلی فقط راهنما هستند.'

  const imageRule =
    imageCount > 0
      ? `imageAlts: دقیقاً ${imageCount} متن جایگزین فارسی، هر کدام حداقل ۳ نویسه.`
      : 'imageAlts را نگذار — عکسی در پیش‌نویس نیست.'

  const productLines = [
    `نام: ${resolvedCurrent.name || '—'}`,
    `نام انگلیسی: ${resolvedCurrent.nameEn || '—'}`,
    `اسلاگ: ${resolvedCurrent.slug || '—'}`,
    `SKU: ${resolvedCurrent.sku || '—'}`,
    `برند: ${resolvedCurrent.brand || '—'}`,
    `سری: ${resolvedCurrent.series || '—'}`,
    `مدل: ${resolvedCurrent.model || '—'}`,
    `دسته: ${resolvedCurrent.category || '—'}`,
    `زیردسته: ${resolvedCurrent.subCategory || '—'}`,
    `توضیح کوتاه: ${resolvedCurrent.shortDescription || '—'}`,
    `توضیح بلند: ${resolvedCurrent.longDescription.slice(0, INSTRUCTION_LONG_DESCRIPTION_MAX) || '—'}`,
    `مشخصات: ${summarizeProductSpecs(input.specs) || '—'}`,
    `عنوان سئوی فعلی: ${resolvedCurrent.seoTitle || '(خالی)'}`,
    `توضیح متای فعلی: ${resolvedCurrent.seoDescription || '(خالی)'}`,
    `کلمهٔ کلیدی فعلی: ${resolvedCurrent.focusKeyword || '(خالی)'}`,
    `canonical فعلی: ${resolvedCurrent.canonicalUrl || '(خالی)'}`,
    `FAQ فعلی: ${
      resolvedCurrent.faqs.length > 0
        ? resolvedCurrent.faqs.map((faq) => `${faq.question} → ${faq.answer}`).join(' | ')
        : '(خالی)'
    }`,
    `متن جایگزین تصاویر: ${
      resolvedCurrent.imageAlts.filter((item) => item.trim()).join(' | ') || '(خالی)'
    }`,
    `تعداد تصویر: ${imageCount}`,
  ]

  return [
    'تو دستیار سئوی فروشگاه فارسی «سایت» هستی (ماشین‌های اداری، چاپ و پرینتر).',
    'کار تو همان تکمیل حرفه‌ای پیش‌نویس محصول است تا کارشناس فقط بازبینی کند و خودش منتشر کند.',
    'فقط یک شیء JSON برگردان؛ بدون توضیح اضافه، بدون markdown، بدون HTML و بدون iframe.',
    'شکل الزامی پاسخ:',
    JSON.stringify(
      {
        fileType: PRODUCT_SEO_FILE_TYPE,
        schemaVersion: PRODUCT_SEO_SCHEMA_VERSION,
        suggestion: PRODUCT_SEO_EXPECTED_SUGGESTION,
      },
      null,
      2
    ),
    'کلیدهای مجاز suggestion (همان allowlist تکمیل حرفه‌ای):',
    `- name، nameEn، slug، sku، series، model`,
    `- category: فقط ${CATEGORIES.map((item) => item.slug).join('، ')}`,
    `- subCategory: فقط اسلاگ زیردستهٔ همان دسته`,
    `- brand: فقط ${BRANDS.map((item) => item.displayName).join('، ')}`,
    `- shortDescription: حداکثر ${SHORT_DESCRIPTION_MAX} نویسه`,
    `- longDescription: حداقل ۸۰۰ کلمه، حداکثر ${LONG_DESCRIPTION_MAX} نویسه، بدون HTML`,
    `- seoTitle: ۴۵ تا ${SEO_TITLE_MAX} نویسه`,
    `- seoDescription: ۱۱۰ تا ${SEO_DESCRIPTION_MAX} نویسه`,
    `- focusKeyword: حداکثر ${FOCUS_KEYWORD_MAX} نویسه`,
    `- canonicalUrl: حداکثر ${CANONICAL_URL_MAX} نویسه؛ javascript: و data: ممنوع`,
    `- faqs: ۳ تا ${FAQ_MAX} مورد؛ سؤال ≤${FAQ_QUESTION_MAX}؛ جواب ≤${FAQ_ANSWER_MAX}`,
    `- attributes: تا ${ATTRIBUTE_MAX} مورد {group,name,value,unit} فقط اگر از روی مدل مطمئنی`,
    `- ${imageRule}`,
    'قواعد محتوا: فارسی معیار، بدون اغراق، بدون لینک خارجی، بدون تگ HTML.',
    'کلید خارج از suggestion ممنوع است. قیمت، موجودی، گارانتی، بارکد، GTIN و کد ایران را ننویس.',
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
  const resolvedCurrent = resolvePackCurrent(input)
  const emptyFields = listEmptySeoFields(resolvedCurrent)
  const suggestion = currentFieldsToSuggestion(resolvedCurrent)
  return {
    fileType: PRODUCT_SEO_FILE_TYPE,
    schemaVersion: PRODUCT_SEO_SCHEMA_VERSION,
    exportedAt: now.toISOString(),
    product: snapshotPackProduct(resolvedCurrent),
    targets: PRODUCT_SEO_TARGETS,
    emptyOnly: input.emptyOnly,
    emptyFields,
    allowlist: SEO_SUGGESTION_KEYS,
    promptPackId: getProductSeoPromptPack(input.promptPackId).id,
    instructionsText: buildProductSeoInstructions(input),
    ...(suggestionHasContent(suggestion) ? { suggestion } : {}),
    expectedResponse: {
      fileType: PRODUCT_SEO_FILE_TYPE,
      schemaVersion: PRODUCT_SEO_SCHEMA_VERSION,
      suggestion: PRODUCT_SEO_EXPECTED_SUGGESTION,
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
