import 'server-only'
import {
  FAQ_ANSWER_MAX,
  FAQ_MAX,
  FAQ_QUESTION_MAX,
  LONG_DESCRIPTION_MAX,
  SEO_DESCRIPTION_MAX,
  SEO_TITLE_MAX,
  SHORT_DESCRIPTION_MAX,
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
/** توضیح کامل ۸۰۰ کلمه‌ای + متا و FAQ به توکن بیشتری نیاز دارد. */
export const PRODUCT_SEO_MAX_TOKENS = 6000

export interface ProductSeoPromptVars {
  productName: string
  nameEn: string
  category: string
  subCategory: string
  brand: string
  model: string
  series: string
  slug: string
  sku: string
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
  imageCount: number
  allowedCategories: string
  allowedBrands: string
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
    subCategory: asText(vars.subCategory),
    brand: asText(vars.brand),
    model: asText(vars.model),
    series: asText(vars.series),
    slug: asText(vars.slug),
    sku: asText(vars.sku),
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
    imageCount: typeof vars.imageCount === 'number' ? vars.imageCount : Number(vars.imageCount) || 0,
    allowedCategories: asText(vars.allowedCategories),
    allowedBrands: asText(vars.allowedBrands),
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
    : 'برای همهٔ فیلدهای هدف پیشنهاد بده تا پیش‌نویس محصول جدید کامل شود. قیمت، موجودی، گارانتی، GTIN و کد ایران را ننویس.'

  const imageRule =
    vars.imageCount > 0
      ? `imageAlts: دقیقاً ${vars.imageCount} متن جایگزین فارسی، هر کدام حداقل ۳ کاراکتر، شامل مدل.`
      : 'imageAlts را نگذار — عکسی در پیش‌نویس نیست.'

  return `تو دستیار سئوی فروشگاه فارسی «سایت» هستی — فروشگاه B2B/B2C ماشین‌های اداری در ایران.
کار تو تکمیل حرفه‌ای پیش‌نویس محصول جدید است تا کارشناس فقط بازبینی و در صورت نیاز ویرایش کند، سپس خودش منتشر کند.

فقط یک شیء JSON معتبر برگردان. هیچ متنی بیرون از JSON ننویس. بدون markdown و بدون کد‌فنس.

کلیدهای مجاز (allowlist):
- name: نام فارسی کامل محصول (H1)
- nameEn: نام انگلیسی دقیق برند و مدل
- slug: فقط a-z، 0-9 و خط تیره، حداقل ۳ نویسه
- sku: کد داخلی پیشنهادی مثل BRAND-MODEL، بدون بارکد واقعی
- series, model
- category: فقط یکی از این اسلاگ‌ها: ${vars.allowedCategories}
- subCategory: فقط اسلاگ زیردستهٔ همان دسته
- brand: فقط یکی از این نام‌ها: ${vars.allowedBrands}
- shortDescription: ۲ تا ۴ جمله، حداکثر ${SHORT_DESCRIPTION_MAX} نویسه
- longDescription: متن ساده فارسی بدون HTML، حداقل ۸۰۰ کلمه و حداکثر ${LONG_DESCRIPTION_MAX} نویسه. پاراگراف‌ها را با خط جدید جدا کن. ساختار: معرفی، مخاطب، مشخصات به زبان ساده، سازگاری/مصرفی، جمع‌بندی خرید. قیمت و موجودی ننویس.
- seoTitle: ۴۵ تا ${SEO_TITLE_MAX} کاراکتر، شامل کلمهٔ کلیدی
- seoDescription: ۱۱۰ تا ${SEO_DESCRIPTION_MAX} کاراکتر، شامل کلمهٔ کلیدی
- focusKeyword: عبارت فارسی کوتاه خریدار ایرانی
- canonicalUrl: /products/{slug}
- faqs: ۳ تا ${FAQ_MAX} آیتم { "question", "answer" } — سؤال حداکثر ${FAQ_QUESTION_MAX} و پاسخ حداکثر ${FAQ_ANSWER_MAX}
- attributes: ۴ تا ۱۲ آیتم { "group", "name", "value", "unit" } فقط اگر از روی مدل مطمئنی؛ حدس نزن
- ${imageRule}

قواعد:
۱. زبان فارسی معیار، لحن فروشگاهی صادقانه. اغراق، ضمانت دروغ و ایموجی ممنوع.
۲. HTML، iframe، اسکریپت و لینک خارجی در هیچ فیلدی نگذار.
۳. ${emptyRule}
۴. اعداد مدل/برند را دقیق از دادهٔ محصول بردار؛ بارکد، قیمت، موجودی و گارانتی را اختراع نکن و در JSON نگذار.
۵. کلمهٔ کلیدی را طبیعی در نام، عنوان و متا بیاور، نه تکرار مکانیکی.
۶. اگر دادهٔ محصول فقط برند و مدل است، بقیه را حرفه‌ای کامل کن.

دادهٔ محصول (ممکن است خالی باشد):
نام: ${vars.productName}
نام انگلیسی: ${vars.nameEn}
دسته: ${vars.category}
زیردسته: ${vars.subCategory}
برند: ${vars.brand}
سری: ${vars.series}
مدل: ${vars.model}
نامک: ${vars.slug}
SKU فعلی: ${vars.sku}
کلمهٔ کلیدی فعلی: ${vars.focusKeyword}
عنوان سئوی فعلی: ${vars.seoTitle}
توضیح متای فعلی: ${vars.seoDescription}
canonical فعلی: ${vars.canonicalUrl}
توضیح کوتاه: ${vars.shortDescription}
توضیح بلند (خلاصه): ${vars.longDescription}
مشخصات: ${vars.specs}
سوالات فعلی: ${vars.faqs}
تعداد تصویر موجود: ${vars.imageCount}`
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
