import { beforeEach, describe, expect, it } from 'vitest'
import { MAX_COMPARE, useCompareStore } from '@/store/compare-store'
import type { Product } from '@/types/product'

const make = (id: string, model: string): Product => ({
  id,
  slug: `p-${id}`,
  brand: 'canon',
  model,
  name: `دستگاه ${model}`,
  sku: `SKU-${id}`,
  category: 'printer',
  priceType: 'fixed',
  price: 1_000_000,
  stockStatus: 'in_stock',
  images: ['/products/printer.svg'],
  shortDescription: '',
  keyFeatures: [],
  specs: [],
  condition: 'new',
  createdAt: '2026-01-01',
})

describe('useCompareStore', () => {
  beforeEach(() => useCompareStore.setState({ items: [] }))

  it('کالا را اضافه می‌کند', () => {
    useCompareStore.getState().toggle(make('1', 'LBP-2900'))
    expect(useCompareStore.getState().items).toHaveLength(1)
  })

  it('toggle دوباره، همان کالا را حذف می‌کند', () => {
    const p = make('1', 'LBP-2900')
    useCompareStore.getState().toggle(p)
    useCompareStore.getState().toggle(p)
    expect(useCompareStore.getState().items).toHaveLength(0)
  })

  it('سقف تعداد را رعایت می‌کند', () => {
    for (let i = 1; i <= MAX_COMPARE + 3; i++) {
      useCompareStore.getState().toggle(make(String(i), `M-${i}`))
    }
    expect(useCompareStore.getState().items).toHaveLength(MAX_COMPARE)
  })

  it('isFull پس از پر شدن true می‌شود', () => {
    for (let i = 1; i <= MAX_COMPARE; i++) {
      useCompareStore.getState().toggle(make(String(i), `M-${i}`))
    }
    expect(useCompareStore.getState().isFull()).toBe(true)
  })

  it('has وضعیت درست را برمی‌گرداند', () => {
    useCompareStore.getState().toggle(make('7', 'X'))
    expect(useCompareStore.getState().has('7')).toBe(true)
    expect(useCompareStore.getState().has('8')).toBe(false)
  })

  it('remove فقط همان کالا را حذف می‌کند', () => {
    useCompareStore.getState().toggle(make('1', 'A'))
    useCompareStore.getState().toggle(make('2', 'B'))
    useCompareStore.getState().remove('1')

    const { items } = useCompareStore.getState()
    expect(items).toHaveLength(1)
    expect(items[0].id).toBe('2')
  })

  it('clear همه را پاک می‌کند', () => {
    useCompareStore.getState().toggle(make('1', 'A'))
    useCompareStore.getState().toggle(make('2', 'B'))
    useCompareStore.getState().clear()
    expect(useCompareStore.getState().items).toHaveLength(0)
  })

  it('فقط دادهٔ سبک کارت را ذخیره می‌کند (نه specs سنگین)', () => {
    useCompareStore.getState().toggle(make('1', 'LBP-2900'))
    const item = useCompareStore.getState().items[0]
    expect(item).toHaveProperty('model', 'LBP-2900')
    expect(item).not.toHaveProperty('specs')
  })
})
