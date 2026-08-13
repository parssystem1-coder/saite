/**
 * کاتالوگ بسته‌های پرامپت سئو — بدون راز، قابل استفاده در کلاینت و سرور.
 * متن رندر نهایی فقط روی سرور ساخته می‌شود.
 */

export const DEFAULT_PRODUCT_SEO_PACK_ID = 'product-seo.v1' as const

export const PRODUCT_SEO_PROMPT_PACK_IDS = [
  'product-seo.v1',
  'product-seo.commercial.v1',
  'product-seo.faq.v1',
] as const

export const PRODUCT_SEO_PROMPT_PACKS = [
  {
    id: 'product-seo.v1',
    title: 'پیشنهاد کامل محصول',
    description: 'عنوان، متا، کلمهٔ کلیدی و پرسش‌های متداول با لحن فروشگاهی صادقانه',
    extraRules: '',
  },
  {
    id: 'product-seo.commercial.v1',
    title: 'لحن سازمانی / B2B',
    description: 'تأکید روی گارانتی، فاکتور رسمی، مشخصات فنی و خریدار سازمانی',
    extraRules:
      'لحن سازمانی: فاکتور رسمی، گارانتی اصالت، مشخصات فنی و خرید عمده. هیجان خرده‌فروشی و شعار تبلیغاتی ننویس.',
  },
  {
    id: 'product-seo.faq.v1',
    title: 'تمرکز پرسش‌های متداول',
    description: '۴ تا ۵ سؤال عملی خریدار ایرانی؛ عنوان و متا دقیق و بدون تکرار',
    extraRules:
      'حداقل ۴ پرسش متداول عملی بنویس (گارانتی، ارسال، سازگاری، مواد مصرفی). عنوان و متا کوتاه و دقیق باشند.',
  },
] as const

export type ProductSeoPromptPackId = (typeof PRODUCT_SEO_PROMPT_PACKS)[number]['id']

export type ProductSeoPromptPackMeta = (typeof PRODUCT_SEO_PROMPT_PACKS)[number]

export function isProductSeoPromptPackId(value: string): value is ProductSeoPromptPackId {
  return PRODUCT_SEO_PROMPT_PACKS.some((pack) => pack.id === value)
}

export function getProductSeoPromptPack(packId?: string): ProductSeoPromptPackMeta {
  if (packId && isProductSeoPromptPackId(packId)) {
    return PRODUCT_SEO_PROMPT_PACKS.find((pack) => pack.id === packId) ?? PRODUCT_SEO_PROMPT_PACKS[0]
  }
  return PRODUCT_SEO_PROMPT_PACKS[0]
}

export function listProductSeoPromptPacks(): readonly ProductSeoPromptPackMeta[] {
  return PRODUCT_SEO_PROMPT_PACKS
}
