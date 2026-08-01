import { describe, expect, it } from 'vitest'
import {
  getCompatibleItems,
  getConsumablesForDevice,
  getProductBySlug,
  getProductsByIds,
  getRelatedProducts,
} from '@/lib/api'
import { PRODUCTS } from '@/lib/mock-data'
import { getRatingSummary, type Product } from '@/types/product'

describe('getRatingSummary', () => {
  it('برای محصول بدون نظر، null برمی‌گرداند', () => {
    const p = { ...PRODUCTS[0], reviews: undefined } as Product
    expect(getRatingSummary(p)).toBeNull()
  })

  it('میانگین را با یک رقم اعشار گرد می‌کند', () => {
    const p = {
      ...PRODUCTS[0],
      reviews: [
        { id: '1', author: 'a', rating: 5, body: '', createdAt: '2026-01-01' },
        { id: '2', author: 'b', rating: 4, body: '', createdAt: '2026-01-01' },
        { id: '3', author: 'c', rating: 4, body: '', createdAt: '2026-01-01' },
      ],
    } as Product

    const r = getRatingSummary(p)
    expect(r?.average).toBe(4.3)
    expect(r?.count).toBe(3)
  })
})

describe('getConsumablesForDevice — فروش مکمل', () => {
  it('برای پرینتر کانن، تونر و درام را برمی‌گرداند', async () => {
    const printer = await getProductBySlug('canon-i-sensys-lbp-2900')
    const items = await getConsumablesForDevice(printer!)

    expect(items.length).toBe(2)
    expect(items.map((i) => i.id)).toEqual(['c-001', 'c-002'])
    expect(items.every((i) => i.category === 'consumables')).toBe(true)
  })

  it('ترتیب تعریف‌شده را حفظ می‌کند', async () => {
    const printer = await getProductBySlug('canon-i-sensys-lbp-2900')
    const items = await getConsumablesForDevice(printer!)
    expect(items[0].id).toBe('c-001')
  })

  it('برای کالای بدون مصرفی، آرایهٔ خالی می‌دهد', async () => {
    const toner = await getProductBySlug('canon-cartridge-303-toner')
    expect(await getConsumablesForDevice(toner!)).toHaveLength(0)
  })
})

describe('سازگاری دوطرفه', () => {
  it('رابطهٔ دستگاه ↔ مصرفی متقارن است', async () => {
    const printer = await getProductBySlug('canon-i-sensys-lbp-2900')
    const consumables = await getConsumablesForDevice(printer!)

    // هر مصرفی باید در compatibleWith خود به همین مدل اشاره کند
    for (const c of consumables) {
      expect(c.compatibleWith).toContain(printer!.model)
    }

    // و جهت معکوس هم باید همین دستگاه را پیدا کند
    const back = await getCompatibleItems(printer!.model)
    expect(back.map((b) => b.id)).toEqual(expect.arrayContaining(consumables.map((c) => c.id)))
  })
})

describe('getProductsByIds', () => {
  it('فقط شناسه‌های معتبر را برمی‌گرداند', async () => {
    const r = await getProductsByIds(['p-001', 'does-not-exist', 'c-001'])
    expect(r).toHaveLength(2)
  })
})

describe('getRelatedProducts', () => {
  it('هم‌دسته است و خود محصول را شامل نمی‌شود', async () => {
    const p = await getProductBySlug('canon-i-sensys-lbp-2900')
    const related = await getRelatedProducts(p!)

    expect(related.every((r) => r.category === p!.category)).toBe(true)
    expect(related.map((r) => r.id)).not.toContain(p!.id)
  })
})

describe('یکپارچگی دادهٔ نمونه', () => {
  it('همهٔ slugها یکتا هستند', () => {
    const slugs = PRODUCTS.map((p) => p.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })

  it('همهٔ شناسه‌ها یکتا هستند', () => {
    const ids = PRODUCTS.map((p) => p.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('کالای قیمت‌ثابت حتماً قیمت دارد', () => {
    for (const p of PRODUCTS) {
      if (p.priceType === 'fixed') expect(p.price).toBeGreaterThan(0)
    }
  })

  it('کالای استعلامی نباید قیمت داشته باشد', () => {
    for (const p of PRODUCTS) {
      if (p.priceType === 'quote_only') expect(p.price).toBeUndefined()
    }
  })

  it('ارجاع‌های consumables همگی معتبرند', () => {
    const ids = new Set(PRODUCTS.map((p) => p.id))
    for (const p of PRODUCTS) {
      for (const c of p.consumables ?? []) expect(ids.has(c)).toBe(true)
    }
  })

  it('هر محصول حداقل یک تصویر دارد', () => {
    for (const p of PRODUCTS) expect(p.images.length).toBeGreaterThan(0)
  })

  it('امتیاز نظرات بین ۱ تا ۵ است', () => {
    for (const p of PRODUCTS) {
      for (const r of p.reviews ?? []) {
        expect(r.rating).toBeGreaterThanOrEqual(1)
        expect(r.rating).toBeLessThanOrEqual(5)
      }
    }
  })
})
