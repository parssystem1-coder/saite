import { BRANDS, STOCK_STATUS_MAP, SITE, buildWhatsAppUrl } from '@/lib/constants'
import { formatNumber, formatPrice } from '@/lib/format'
import type { Product, ProductCardData } from '@/types/product'

/** حداقل داده لازم برای ساخت پیام استعلام محصول */
export type ProductQuoteInput = Pick<
  Product,
  | 'name'
  | 'brand'
  | 'model'
  | 'sku'
  | 'slug'
  | 'stockStatus'
  | 'priceType'
  | 'price'
> &
  Partial<Pick<ProductCardData, 'id' | 'images' | 'keyFeatures' | 'category' | 'condition'>>

/** پیام پیش‌فرض مشاوره */
export function defaultConsultMessage(context?: string): string {
  const base = `سلام، از ${SITE.fullName} پیام می‌دهم.`
  if (context?.trim()) return `${base}\n${context.trim()}`
  return `${base}\nبرای مشاورهٔ خرید تجهیزات اداری راهنمایی می‌خواهم.`
}

/**
 * پیام استعلام کامل یک کالا برای فروشنده.
 * شامل نام، برند، مدل، SKU، موجودی، قیمت/نوع قیمت، تعداد و لینک صفحه.
 */
export function buildProductInquiryMessage(
  product: ProductQuoteInput,
  options?: { quantity?: number; productUrl?: string }
): string {
  const brand =
    BRANDS.find((b) => b.slug === product.brand)?.displayName ?? product.brand
  const stockLabel = STOCK_STATUS_MAP[product.stockStatus]?.label ?? product.stockStatus
  const quantity = Math.max(1, options?.quantity ?? 1)
  const url =
    options?.productUrl ??
    (typeof window !== 'undefined'
      ? `${window.location.origin}/products/${product.slug}`
      : `/products/${product.slug}`)

  const isFixed = product.priceType === 'fixed' && product.price !== undefined
  const priceTypeLabel = isFixed ? 'نقدی' : 'فقط استعلامی'
  const priceLine = isFixed
    ? `• قیمت نمایشی: ${formatPrice(product.price!)} تومان`
    : '• قیمت نمایشی: — (نیاز به استعلام)'

  return [
    `سلام،`,
    `از ${SITE.fullName} برای استعلام این کالا پیام می‌دهم.`,
    ``,
    `📦 مشخصات کالا`,
    `• نام: ${product.name}`,
    `• برند: ${brand}`,
    `• مدل: ${product.model}`,
    `• کد کالا (SKU): ${product.sku}`,
    `• وضعیت موجودی: ${stockLabel}`,
    `• نوع قیمت: ${priceTypeLabel}`,
    priceLine,
    `• تعداد درخواستی: ${formatNumber(quantity)}`,
    `• لینک محصول:`,
    url,
    ``,
    `لطفاً موجودی و قیمت نهایی را اعلام کنید.`,
    `با سپاس`,
  ].join('\n')
}

/**
 * سازگاری عقب‌رو — اگر فقط مدل/نام باشد پیام ساده می‌سازد.
 * ترجیح: buildProductInquiryMessage
 */
export function productQuoteMessage(model: string, name?: string): string {
  const label = name ? `${name} (${model})` : model
  return [
    `سلام،`,
    `از ${SITE.fullName} برای استعلام این کالا پیام می‌دهم.`,
    ``,
    `• کالا: ${label}`,
    ``,
    `لطفاً موجودی و قیمت نهایی را اعلام کنید.`,
    `با سپاس`,
  ].join('\n')
}

export function cartQuoteMessage(lines: string[]): string {
  if (lines.length === 0) {
    return defaultConsultMessage('دربارهٔ سبد خرید / سفارش سوال دارم.')
  }
  return [
    `سلام،`,
    `از ${SITE.fullName} مایل به استعلام / هماهنگی سفارش هستم:`,
    ``,
    ...lines.map((l) => `• ${l}`),
    ``,
    `لطفاً موجودی و قیمت نهایی را اعلام کنید.`,
    `با سپاس`,
  ].join('\n')
}

export function openWhatsAppHref(message: string): string {
  return buildWhatsAppUrl(message)
}
