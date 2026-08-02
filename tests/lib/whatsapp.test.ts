import { describe, expect, it } from 'vitest'
import { SITE } from '@/lib/constants'
import {
  buildProductInquiryMessage,
  cartQuoteMessage,
  defaultConsultMessage,
  openWhatsAppHref,
  productQuoteMessage,
} from '@/lib/whatsapp'
import type { ProductQuoteInput } from '@/lib/whatsapp'

const sampleProduct: ProductQuoteInput = {
  name: 'پرینتر لیزری کانن LBP-2900',
  brand: 'canon',
  model: 'LBP-2900',
  sku: 'CN-LBP2900',
  slug: 'canon-i-sensys-lbp-2900',
  stockStatus: 'in_stock',
  priceType: 'fixed',
  price: 4_850_000,
}

describe('whatsapp helpers', () => {
  it('لینک wa.me با شماره E.164 می‌سازد', () => {
    const href = openWhatsAppHref('سلام')
    expect(href).toContain(`wa.me/${SITE.whatsappE164}`)
    expect(href).toContain('text=')
  })

  it('پیام استعلام کامل شامل فیلدهای کلیدی است', () => {
    const msg = buildProductInquiryMessage(sampleProduct, {
      quantity: 2,
      productUrl: 'https://example.com/products/canon-i-sensys-lbp-2900',
    })

    expect(msg).toContain(SITE.fullName)
    expect(msg).toContain(sampleProduct.name)
    expect(msg).toContain('Canon')
    expect(msg).toContain('LBP-2900')
    expect(msg).toContain('CN-LBP2900')
    expect(msg).toContain('موجود در انبار')
    expect(msg).toContain('نقدی')
    expect(msg).toContain('تومان')
    expect(msg).toContain('۲') // تعداد فارسی
    expect(msg).toContain('https://example.com/products/canon-i-sensys-lbp-2900')
    expect(msg).toContain('موجودی و قیمت نهایی')
  })

  it('برای کالای استعلامی قیمت نمایشی را خالی می‌گذارد', () => {
    const msg = buildProductInquiryMessage({
      ...sampleProduct,
      priceType: 'quote_only',
      price: undefined,
      stockStatus: 'on_request',
    })
    expect(msg).toContain('فقط استعلامی')
    expect(msg).toContain('نیاز به استعلام')
    expect(msg).toContain('تماس بگیرید')
  })

  it('productQuoteMessage سازگاری عقب‌رو را حفظ می‌کند', () => {
    const msg = productQuoteMessage('LBP-2900', 'پرینتر کانن')
    expect(msg).toContain('LBP-2900')
    expect(msg).toContain('پرینتر کانن')
  })

  it('پیام سبد خطوط اقلام را دارد', () => {
    const msg = cartQuoteMessage(['پرینتر × 1', 'تونر × 2'])
    expect(msg).toContain('پرینتر × 1')
    expect(msg).toContain('تونر × 2')
  })

  it('پیام پیش‌فرض نام فروشگاه را دارد', () => {
    expect(defaultConsultMessage()).toContain(SITE.fullName)
  })
})
