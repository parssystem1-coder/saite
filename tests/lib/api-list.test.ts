import { afterEach, describe, expect, it } from 'vitest'
import { getProductList, getProducts } from '@/lib/api'
import { PRODUCTS } from '@/lib/mock-data'

describe('getProductList (mock contract)', () => {
  afterEach(() => {
    // اطمینان از حالت mock
    delete process.env.NEXT_PUBLIC_USE_MOCK
  })

  it('بدون فیلتر، total برابر کل کاتالوگ است', async () => {
    const r = await getProductList({ page: 1, perPage: 9 })
    expect(r.total).toBe(PRODUCTS.length)
    expect(r.items.length).toBeLessThanOrEqual(9)
    expect(r.page).toBe(1)
    expect(r.totalPages).toBe(Math.ceil(PRODUCTS.length / 9))
  })

  it('فیلتر دسته را اعمال می‌کند', async () => {
    const r = await getProductList({ category: 'printer', page: 1, perPage: 50 })
    expect(r.items.every((p) => p.category === 'printer')).toBe(true)
    expect(r.total).toBe(r.items.length)
  })

  it('صفحه‌بندی slice درست برمی‌گرداند', async () => {
    const page1 = await getProductList({ page: 1, perPage: 5, sort: 'newest' })
    const page2 = await getProductList({ page: 2, perPage: 5, sort: 'newest' })
    expect(page1.items).toHaveLength(5)
    expect(page1.items[0].id).not.toBe(page2.items[0]?.id)
    expect(page1.total).toBe(page2.total)
  })

  it('صفحهٔ بیش از حد را به آخرین صفحه clamp می‌کند', async () => {
    const r = await getProductList({ page: 999, perPage: 10 })
    expect(r.page).toBe(r.totalPages)
    expect(r.items.length).toBeGreaterThan(0)
  })

  it('جستجوی q روی مدل کار می‌کند', async () => {
    const r = await getProductList({ q: 'LBP-2900', page: 1, perPage: 20 })
    expect(r.total).toBeGreaterThanOrEqual(1)
    expect(
      r.items.some((p) => p.model.toLowerCase().includes('lbp-2900'))
    ).toBe(true)
  })

  it('getProducts بدون آرگومان آرایهٔ کامل می‌دهد (سازگاری عقب‌رو)', async () => {
    const all = await getProducts()
    expect(Array.isArray(all)).toBe(true)
    expect(all).toHaveLength(PRODUCTS.length)
  })

  it('getProducts با فیلتر بدون page آرایهٔ فیلترشده می‌دهد', async () => {
    const list = await getProducts({ category: 'consumables' })
    expect(Array.isArray(list)).toBe(true)
    expect(list.every((p) => p.category === 'consumables')).toBe(true)
  })
})
