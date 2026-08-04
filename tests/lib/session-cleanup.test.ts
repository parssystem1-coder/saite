import { beforeEach, describe, expect, it } from 'vitest'
import { getDeviceId } from '@/lib/auth/device-id'
import { clearPersonalSessionData } from '@/lib/auth/session-cleanup'
import { __clearTrustedDevices, isDeviceTrusted, trustCurrentDevice } from '@/lib/auth/trusted-devices'
import { trackProductView } from '@/lib/recently-viewed'
import { useCartStore } from '@/store/cart-store'
import { useCompareStore } from '@/store/compare-store'
import { useWishlistStore } from '@/store/wishlist-store'
import { quoteOnlyProduct, sampleProduct } from '../fixtures/product'

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  __clearTrustedDevices()
  useCartStore.setState({ items: [] })
  useWishlistStore.setState({ items: [] })
  useCompareStore.setState({ items: [] })
})

/**
 * جلوگیری از نشت دادهٔ کاربر قبلی روی دستگاه مشترک.
 *
 * سناریو: کاربر A وارد می‌شود، کالا در سبد می‌گذارد، خارج می‌شود.
 * کاربر B روی همان دستگاه وارد می‌شود — نباید سبد A را ببیند.
 */
describe('clearPersonalSessionData', () => {
  it('🔑 سبد خرید کاربر قبلی پاک می‌شود', () => {
    useCartStore.getState().addItem(sampleProduct, 3)
    expect(useCartStore.getState().itemCount()).toBe(3)

    clearPersonalSessionData()

    expect(useCartStore.getState().itemCount()).toBe(0)
  })

  it('🔑 علاقه‌مندی‌ها پاک می‌شوند', () => {
    useWishlistStore.getState().toggle(sampleProduct)
    expect(useWishlistStore.getState().items).toHaveLength(1)

    clearPersonalSessionData()

    expect(useWishlistStore.getState().items).toHaveLength(0)
  })

  it('🔑 فهرست مقایسه پاک می‌شود', () => {
    useCompareStore.getState().toggle(sampleProduct)
    useCompareStore.getState().toggle(quoteOnlyProduct)
    expect(useCompareStore.getState().items).toHaveLength(2)

    clearPersonalSessionData()

    expect(useCompareStore.getState().items).toHaveLength(0)
  })

  it('🔑 تاریخچهٔ بازدید پاک می‌شود — کاربر بعدی نمی‌بیند قبلی دنبال چه بود', () => {
    trackProductView(sampleProduct)
    expect(sessionStorage.getItem('saite:recently-viewed')).toBeTruthy()

    clearPersonalSessionData()

    expect(sessionStorage.getItem('saite:recently-viewed')).toBeNull()
  })

  it('🔑 اطلاعات سفارش اخیر پاک می‌شود', () => {
    sessionStorage.setItem('saite:last-order-ref', '123456')
    sessionStorage.setItem('saite:last-order-meta', '{"ref":"123456"}')

    clearPersonalSessionData()

    expect(sessionStorage.getItem('saite:last-order-ref')).toBeNull()
    expect(sessionStorage.getItem('saite:last-order-meta')).toBeNull()
  })
})

describe('آنچه عمداً پاک نمی‌شود', () => {
  it('🔑 شناسهٔ دستگاه باقی می‌ماند — وگرنه هر خروج دستگاه را فراموش می‌کرد', () => {
    const before = getDeviceId()

    clearPersonalSessionData()

    expect(getDeviceId()).toBe(before)
  })

  it('🔑 فهرست دستگاه‌های مورد اعتماد باقی می‌ماند', () => {
    trustCurrentDevice('09123456789')
    expect(isDeviceTrusted('09123456789')).toBe(true)

    clearPersonalSessionData()

    // کاربر پس از خروج و ورود دوباره، نباید دستگاهش را از دست بدهد
    expect(isDeviceTrusted('09123456789')).toBe(true)
  })
})

describe('سناریوی کامل: تعویض کاربر روی دستگاه مشترک', () => {
  it('🔑 کاربر دوم هیچ‌یک از دادهٔ کاربر اول را نمی‌بیند', () => {
    // کاربر A
    useCartStore.getState().addItem(sampleProduct, 2)
    useWishlistStore.getState().toggle(quoteOnlyProduct)
    trackProductView(sampleProduct)

    // خروج A
    clearPersonalSessionData()

    // کاربر B وارد می‌شود
    expect(useCartStore.getState().items).toHaveLength(0)
    expect(useWishlistStore.getState().items).toHaveLength(0)
    expect(useCompareStore.getState().items).toHaveLength(0)
    expect(sessionStorage.getItem('saite:recently-viewed')).toBeNull()
  })
})
