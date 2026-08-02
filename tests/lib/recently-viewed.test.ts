import { beforeEach, describe, expect, it } from 'vitest'
import { getRecentlyViewed, trackProductView } from '@/lib/recently-viewed'
import type { RecentProduct } from '@/lib/recently-viewed'

const sample = (id: string): RecentProduct => ({
  id,
  slug: `slug-${id}`,
  name: `نام ${id}`,
  brand: 'canon',
  model: `M-${id}`,
  images: ['/products/printer.svg'],
  priceType: 'fixed',
  price: 1_000_000,
  stockStatus: 'in_stock',
})

describe('recently-viewed', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  it('بازدید را در ابتدای فهرست می‌گذارد', () => {
    trackProductView(sample('a'))
    trackProductView(sample('b'))
    const list = getRecentlyViewed()
    expect(list[0].id).toBe('b')
    expect(list[1].id).toBe('a')
  })

  it('بازدید تکراری را به بالا می‌آورد نه ردیف جدید', () => {
    trackProductView(sample('a'))
    trackProductView(sample('b'))
    trackProductView(sample('a'))
    const list = getRecentlyViewed()
    expect(list).toHaveLength(2)
    expect(list[0].id).toBe('a')
  })

  it('excludeId را حذف می‌کند', () => {
    trackProductView(sample('a'))
    trackProductView(sample('b'))
    expect(getRecentlyViewed('a').map((p) => p.id)).toEqual(['b'])
  })
})
