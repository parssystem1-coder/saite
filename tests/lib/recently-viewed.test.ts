import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  __resetRecentlyViewedCache,
  clearRecentlyViewed,
  getRecentlyViewed,
  getRecentlyViewedSnapshot,
  getServerSnapshot,
  subscribeRecentlyViewed,
  trackProductView,
} from '@/lib/recently-viewed'
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
    __resetRecentlyViewedCache()
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

/**
 * قفل ضدرگرسیون برای باگ:
 *   «The result of getSnapshot should be cached to avoid an infinite loop»
 *
 * علت: getRecentlyViewed در هر فراخوانی آرایهٔ تازه می‌ساخت، پس
 * useSyncExternalStore با Object.is هر بار تغییر می‌دید.
 */
describe('getRecentlyViewedSnapshot — پایداری reference', () => {
  beforeEach(() => {
    sessionStorage.clear()
    __resetRecentlyViewedCache()
  })

  it('🔑 با دادهٔ بدون تغییر، همان reference را برمی‌گرداند', () => {
    trackProductView(sample('a'))
    const first = getRecentlyViewedSnapshot()
    const second = getRecentlyViewedSnapshot()
    // Object.is باید true بدهد وگرنه React حلقهٔ بی‌نهایت می‌زند
    expect(first).toBe(second)
  })

  it('🔑 روی فهرست خالی هم reference پایدار است', () => {
    expect(getRecentlyViewedSnapshot()).toBe(getRecentlyViewedSnapshot())
  })

  it('پس از تغییر داده، reference جدید می‌دهد', () => {
    trackProductView(sample('a'))
    const before = getRecentlyViewedSnapshot()
    trackProductView(sample('b'))
    const after = getRecentlyViewedSnapshot()
    expect(after).not.toBe(before)
    expect(after.map((p) => p.id)).toEqual(['b', 'a'])
  })

  it('getServerSnapshot همیشه یک reference ثابت است', () => {
    expect(getServerSnapshot()).toBe(getServerSnapshot())
    expect(getServerSnapshot()).toHaveLength(0)
  })

  it('دادهٔ خراب در storage باعث کرش نمی‌شود', () => {
    sessionStorage.setItem('saite:recently-viewed', '{ not json')
    __resetRecentlyViewedCache()
    expect(getRecentlyViewedSnapshot()).toEqual([])
  })

  it('آیتم‌های بی‌شکل فیلتر می‌شوند', () => {
    sessionStorage.setItem(
      'saite:recently-viewed',
      JSON.stringify([{ id: 'ok', slug: 's', name: 'n', images: [] }, { broken: true }, null])
    )
    __resetRecentlyViewedCache()
    expect(getRecentlyViewedSnapshot()).toHaveLength(1)
  })
})

describe('subscribeRecentlyViewed', () => {
  beforeEach(() => {
    sessionStorage.clear()
    __resetRecentlyViewedCache()
  })

  it('🔑 در همان تب هم اطلاع می‌دهد — رویداد storage اینجا fire نمی‌شود', () => {
    const listener = vi.fn()
    const unsubscribe = subscribeRecentlyViewed(listener)

    trackProductView(sample('a'))
    expect(listener).toHaveBeenCalledTimes(1)

    unsubscribe()
    trackProductView(sample('b'))
    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('پس از clear هم اطلاع می‌دهد', () => {
    const listener = vi.fn()
    const unsubscribe = subscribeRecentlyViewed(listener)
    clearRecentlyViewed()
    expect(listener).toHaveBeenCalled()
    unsubscribe()
  })
})
