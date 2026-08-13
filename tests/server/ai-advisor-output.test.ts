import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  parseAdvisorOutput,
  validateSuggestions,
  SUGGESTION_BLOCK_OPEN,
  SUGGESTION_BLOCK_CLOSE,
  MAX_SUGGESTED_PRODUCTS,
} from '@/server/ai/features/sales-advisor/output'

vi.mock('@/server/shared/db', () => ({
  prisma: {
    product: {
      findMany: vi.fn(),
    },
  },
}))

const { prisma } = await import('@/server/shared/db')

/** قانون امنیتی شمارهٔ ۳: اعتبارسنجی اثر واقعی خروجی AI */
describe('sales-advisor output — اعتبارسنجی ارجاع محصول', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('بدون بلاک پیشنهاد — متن دست‌نخورده و بدون شناسه', () => {
    const { cleanText, rawSuggestedIds } = parseAdvisorOutput('این پرینتر برای دفتر کوچک مناسب است.')
    expect(cleanText).toBe('این پرینتر برای دفتر کوچک مناسب است.')
    expect(rawSuggestedIds).toEqual([])
  })

  it('بلاک معتبر — استخراج شناسه‌ها و حذف بلاک از متن قابل نمایش', () => {
    const raw = `این محصول توصیه می‌شود.\n${SUGGESTION_BLOCK_OPEN}\n[{"id":"p1"},{"id":"p2"}]\n${SUGGESTION_BLOCK_CLOSE}`
    const { cleanText, rawSuggestedIds } = parseAdvisorOutput(raw)

    expect(cleanText).toBe('این محصول توصیه می‌شود.')
    expect(cleanText).not.toContain(SUGGESTION_BLOCK_OPEN)
    expect(rawSuggestedIds).toEqual(['p1', 'p2'])
  })

  it('بلاک با JSON خراب — بلاک حذف می‌شود ولی هیچ شناسه‌ای برنمی‌گردد', () => {
    const raw = `متن سالم ${SUGGESTION_BLOCK_OPEN} {not-json!!} ${SUGGESTION_BLOCK_CLOSE}`
    const { cleanText, rawSuggestedIds } = parseAdvisorOutput(raw)

    expect(cleanText).toBe('متن سالم')
    expect(rawSuggestedIds).toEqual([])
  })

  it('بلاک بسته‌نشده — باز هم نشانه‌های داخلی در متن کاربر نمی‌ماند', () => {
    const raw = `پیشنهاد من ${SUGGESTION_BLOCK_OPEN} [{"id":"p1"}]`
    const { cleanText, rawSuggestedIds } = parseAdvisorOutput(raw)

    expect(cleanText).toBe('پیشنهاد من')
    expect(rawSuggestedIds).toEqual(['p1'])
  })

  it('شناسه‌های تکراری حذف و حداکثر مجاز رعایت می‌شود', () => {
    const items = Array.from({ length: 8 }, (_, i) => ({ id: `p${i % 5}` }))
    const raw = `x ${SUGGESTION_BLOCK_OPEN} ${JSON.stringify(items)} ${SUGGESTION_BLOCK_CLOSE}`
    const { rawSuggestedIds } = parseAdvisorOutput(raw)

    expect(new Set(rawSuggestedIds).size).toBe(rawSuggestedIds.length)
    expect(rawSuggestedIds).toHaveLength(MAX_SUGGESTED_PRODUCTS)
  })

  it('validateSuggestions — فقط شناسه‌های موجود در دیتابیس برمی‌گردند (به ترتیب پیشنهاد مدل)', async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValue([
      {
        id: 'p2',
        slug: 'printer-x',
        brand: 'hp',
        model: 'M404',
        name: 'پرینتر اچ‌پی',
        category: 'printer',
        priceType: 'fixed',
        price: 10_000_000,
        compareAtPrice: null,
        stockStatus: 'in_stock',
        images: ['/img.png'],
        keyFeatures: ['لیزری'],
        condition: 'new',
      },
    ] as never)

    const products = await validateSuggestions(['p-unknown', 'p2'])

    expect(prisma.product.findMany).toHaveBeenCalledTimes(1)
    expect(products).toHaveLength(1)
    expect(products[0].id).toBe('p2')
    expect(products[0].price).toBe(10_000_000)
  })

  it('validateSuggestions — ورودی خالی هیچ کوئری نمی‌زند', async () => {
    const products = await validateSuggestions([])
    expect(products).toEqual([])
    expect(prisma.product.findMany).not.toHaveBeenCalled()
  })

  it('validateSuggestions — خروجی هرگز از سقف مجاز بیشتر نمی‌شود', async () => {
    const rows = Array.from({ length: 6 }, (_, i) => ({
      id: `p${i}`,
      slug: `p${i}`,
      brand: 'hp',
      model: 'M',
      name: 'نام',
      category: 'printer',
      priceType: 'fixed',
      price: 1,
      compareAtPrice: null,
      stockStatus: 'in_stock',
      images: [],
      keyFeatures: [],
      condition: 'new',
    }))
    vi.mocked(prisma.product.findMany).mockResolvedValue(rows as never)

    const products = await validateSuggestions(rows.map((r) => r.id))
    expect(products.length).toBeLessThanOrEqual(MAX_SUGGESTED_PRODUCTS)
  })
})
