import { beforeEach, describe, expect, it } from 'vitest'
import { useWishlistStore } from '@/store/wishlist-store'
import type { Product } from '@/types/product'

const make = (id: string): Product => ({
  id,
  slug: `p-${id}`,
  brand: 'canon',
  model: `M-${id}`,
  name: `دستگاه ${id}`,
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

describe('useWishlistStore', () => {
  beforeEach(() => useWishlistStore.setState({ items: [] }))

  it('کالا را اضافه می‌کند', () => {
    useWishlistStore.getState().toggle(make('1'))
    expect(useWishlistStore.getState().items).toHaveLength(1)
  })

  it('toggle دوباره آن را حذف می‌کند', () => {
    const p = make('1')
    useWishlistStore.getState().toggle(p)
    useWishlistStore.getState().toggle(p)
    expect(useWishlistStore.getState().items).toHaveLength(0)
  })

  it('برخلاف مقایسه، سقف تعداد ندارد', () => {
    for (let i = 1; i <= 12; i++) useWishlistStore.getState().toggle(make(String(i)))
    expect(useWishlistStore.getState().items).toHaveLength(12)
  })

  it('زمان افزودن را ثبت می‌کند', () => {
    useWishlistStore.getState().toggle(make('1'))
    const item = useWishlistStore.getState().items[0]
    expect(item.addedAt).toBeTruthy()
    expect(new Date(item.addedAt).getTime()).not.toBeNaN()
  })

  it('has وضعیت درست را برمی‌گرداند', () => {
    useWishlistStore.getState().toggle(make('5'))
    expect(useWishlistStore.getState().has('5')).toBe(true)
    expect(useWishlistStore.getState().has('6')).toBe(false)
  })

  it('remove فقط همان کالا را حذف می‌کند', () => {
    useWishlistStore.getState().toggle(make('1'))
    useWishlistStore.getState().toggle(make('2'))
    useWishlistStore.getState().remove('1')
    expect(useWishlistStore.getState().items.map((i) => i.id)).toEqual(['2'])
  })

  it('clear همه را پاک می‌کند', () => {
    useWishlistStore.getState().toggle(make('1'))
    useWishlistStore.getState().toggle(make('2'))
    useWishlistStore.getState().clear()
    expect(useWishlistStore.getState().items).toHaveLength(0)
  })
})
