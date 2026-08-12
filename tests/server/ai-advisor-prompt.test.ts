import { describe, it, expect } from 'vitest'
import { buildAdvisorSystemPrompt } from '@/server/ai/features/sales-advisor/prompt'
import {
  SUGGESTION_BLOCK_CLOSE,
  SUGGESTION_BLOCK_OPEN,
} from '@/server/ai/features/sales-advisor/output'
import type { AdvisorCatalogProduct } from '@/server/ai/features/sales-advisor/retrieval'

const sample: AdvisorCatalogProduct = {
  id: 'prod-123',
  name: 'پرینتر لیزری اچ‌پی لیزرجت پرو',
  brand: 'hp',
  model: 'M404dn',
  category: 'printer',
  priceType: 'fixed',
  price: 12_500_000,
  stockStatus: 'in_stock',
  keyFeatures: ['لیزری', 'دو رو', 'شبکه'],
}

const quoteOnly: AdvisorCatalogProduct = {
  ...sample,
  id: 'prod-9',
  priceType: 'quote_only',
  price: null,
  stockStatus: 'on_request',
}

describe('sales-advisor prompt — قرارداد پرامپت سیستم', () => {
  it('قواعد امنیتی کلیدی در پرامپت حضور دارد', () => {
    const prompt = buildAdvisorSystemPrompt([sample])

    expect(prompt).toContain('مشاور فروش')
    // ممنوعیت ساخت قیمت/تخفیف
    expect(prompt).toMatch(/قیمت، تخفیف|قیمت.*از خود نساز/)
    // ممنوعیت وعدهٔ ثبت سفارش/پرداخت
    expect(prompt).toMatch(/ثبت سفارش|پرداخت/)
    // فارسی پاسخ بده
    expect(prompt).toContain('فارسی')
    // قرارداد بلاک پیشنهادها
    expect(prompt).toContain(SUGGESTION_BLOCK_OPEN)
    expect(prompt).toContain(SUGGESTION_BLOCK_CLOSE)
  })

  it('محصولات با ID، برند، دستهٔ فارسی، قیمت و برچسب موجودی در کانتکست می‌آیند', () => {
    const prompt = buildAdvisorSystemPrompt([sample])

    expect(prompt).toContain('[ID: prod-123]')
    expect(prompt).toContain('پرینتر لیزری اچ‌پی لیزرجت پرو')
    expect(prompt).toContain('پرینتر') // نام فارسی دسته
    expect(prompt).toContain('12,500,000 تومان')
    expect(prompt).toContain('موجود در انبار')
  })

  it('کالای استعلامی هیچ‌وقت قیمت ساختگی نمی‌گیرد', () => {
    const prompt = buildAdvisorSystemPrompt([quoteOnly])
    expect(prompt).toContain('استعلام قیمت')
    expect(prompt).not.toMatch(/prod-9[^\n]*تومان/)
  })

  it('کاتالوگ خالی — متن صریح «محصولی پیدا نشد» تزریق می‌شود', () => {
    const prompt = buildAdvisorSystemPrompt([])
    expect(prompt).toContain('محصول مرتبطی در انبار پیدا نشد')
  })
})
