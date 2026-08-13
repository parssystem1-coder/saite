import 'server-only'
import {
  FAQ_ANSWER_MAX,
  FAQ_MAX,
  FAQ_MIN,
  FAQ_QUESTION_MAX,
  SEO_DESCRIPTION_MAX,
  SEO_TITLE_MAX,
} from '@/lib/seo/product-seo-suggestion'
import {
  DEFAULT_PRODUCT_SEO_PACK_ID,
  getProductSeoPromptPack,
  isProductSeoPromptPackId,
  type ProductSeoPromptPackId,
} from '@/lib/seo/product-seo-prompt-packs'
import { ValidationError } from '@/server/shared/errors'

export const PRODUCT_SEO_FEATURE = 'product-seo'
export const PRODUCT_SEO_PROMPT_VERSION = 'product-seo.v1'
export const PRODUCT_SEO_MAX_TOKENS = 1200

export interface ProductSeoPromptVars {
  productName: string
  nameEn: string
  category: string
  brand: string
  model: string
  series: string
  slug: string
  focusKeyword: string
  seoTitle: string
  seoDescription: string
  canonicalUrl: string
  shortDescription: string
  longDescription: string
  specs: string
  faqs: string
  emptyOnly: boolean
  emptyFields: string
  keywordHints: string
}

function asText(value: unknown, fallback = ''): string {
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return fallback
}

/** تبدیل امن Record گیتوی به متغیرهای پرامپت — بدون any. */
export function toProductSeoPromptVars(vars: Record<string, unknown>): ProductSeoPromptVars {
  return {
    productName: asText(vars.productName),
    nameEn: asText(vars.nameEn),
    category: asText(vars.category),
    brand: asText(vars.brand),
    model: asText(vars.model),
    series: asText(vars.series),
    slug: asText(vars.slug),
    focusKeyword: asText(vars.focusKeyword),
    seoTitle: asText(vars.seoTitle),
    seoDescription: asText(vars.seoDescription),
    canonicalUrl: asText(vars.canonicalUrl),
    shortDescription: asText(vars.shortDescription),
    longDescription: asText(vars.longDescription),
    specs: asText(vars.specs),
    faqs: asText(vars.faqs),
    emptyOnly: vars.emptyOnly === true,
    emptyFields: asText(vars.emptyFields),
    keywordHints: asText(vars.keywordHints),
  }
}

export function resolveProductSeoPromptPackId(packId?: string): ProductSeoPromptPackId {
  const id = packId?.trim() || DEFAULT_PRODUCT_SEO_PACK_ID
  if (!isProductSeoPromptPackId(id)) {
    throw new ValidationError({ packId: 'بستهٔ پرامپت نامعتبر است' }, 'بستهٔ پرامپت نامعتبر است.')
  }
  return id
}

export function renderProductSeoPrompt(vars: ProductSeoPromptVars): string {
  const emptyRule = vars.emptyOnly
    ? `فقط برای این فیلدهای خالی پیشنهاد بده و بقیه را در JSON نگذار: ${vars.emptyFields || 'هیچ'}`
    : 'برای همهٔ فیلدهای هدف پیشنهاد بده، حتی اگر الان پر هستند.'

  return `تو دستیار سئوی فروشگاه فارسی «سایت» هستی — فروشگاه B2B/B2C ماشین‌های اداری در ایران.

فقط یک شیء JSON معتبر برگردان. هیچ متنی بیرون از JSON ننویس. بدون markdown و بدون کد‌فنس.

کلیدهای مجاز (allowlist):
- seoTitle: رشته، ۴۵ تا ${SEO_TITLE_MAX} کاراکتر، شامل کلمهٔ کلیدی
- seoDescription: رشته، ۱۱۰ تا ${SEO_DESCRIPTION_MAX} کاراکتر، شامل کلمهٔ کلیدی
- focusKeyword: عبارت فارسی کوتاه و طبیعی برای جستجوی خریدار ایرانی
- canonicalUrl: اختیاری؛ مسیر داخلی مثل /products/slug یا خالی
- faqs: آرایهٔ ${FAQ_MIN} تا ${FAQ_MAX} آیتم { "question", "answer" } — سؤال حداکثر ${FAQ_QUESTION_MAX} و پاسخ حداکثر ${FAQ_ANSWER_MAX} کاراکتر

قواعد:
۱. زبان فارسی معیار، لحن فروشگاهی صادقانه. اغراق، ضمانت دروغ و ایموجی ممنوع.
۲. HTML، iframe، اسکریپت و لینک خارجی در هیچ فیلدی نگذار.
۳. ${emptyRule}
۴. اعداد مدل/برند را دقیق از دادهٔ محصول بردار؛ چیزی از خودت اختراع نکن.
۵. کلمهٔ کلیدی را طبیعی در عنوان و متا بیاور، نه تکرار مکانیکی.

دادهٔ محصول:
نام: ${vars.productName}
نام انگلیسی: ${vars.nameEn}
دسته: ${vars.category}
برند: ${vars.brand}
سری: ${vars.series}
مدل: ${vars.model}
نامک: ${vars.slug}
کلمهٔ کلیدی فعلی: ${vars.focusKeyword}
عنوان سئوی فعلی: ${vars.seoTitle}
توضیح متای فعلی: ${vars.seoDescription}
canonical فعلی: ${vars.canonicalUrl}
توضیح کوتاه: ${vars.shortDescription}
توضیح بلند (خلاصه): ${vars.longDescription}
مشخصات: ${vars.specs}
سوالات فعلی: ${vars.faqs}`
}

export function renderProductSeoPromptByPack(
  packId: string | undefined,
  vars: ProductSeoPromptVars
): string {
  const pack = getProductSeoPromptPack(resolveProductSeoPromptPackId(packId))
  const extras: string[] = []
  if (pack.extraRules) extras.push(pack.extraRules)
  if (vars.keywordHints.trim()) {
    extras.push(
      `دادهٔ کمکی ابزار سئو (فقط راهنما؛ عدد حجم/سختی را در متن محصول ننویس مگر لازم باشد):\n${vars.keywordHints}`
    )
  }
  const base = renderProductSeoPrompt(vars)
  return extras.length > 0 ? `${base}\n\n${extras.join('\n')}` : base
}
