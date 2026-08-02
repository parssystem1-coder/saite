import { describe, expect, it } from 'vitest'
import { SITE } from '@/lib/constants'
import {
  cartQuoteMessage,
  defaultConsultMessage,
  openWhatsAppHref,
  productQuoteMessage,
} from '@/lib/whatsapp'

describe('whatsapp helpers', () => {
  it('لینک wa.me با شماره E.164 می‌سازد', () => {
    const href = openWhatsAppHref('سلام')
    expect(href).toContain(`wa.me/${SITE.whatsappE164}`)
    expect(href).toContain('text=')
  })

  it('پیام استعلام محصول شامل مدل است', () => {
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
    expect(defaultConsultMessage()).toContain(SITE.name)
  })
})
