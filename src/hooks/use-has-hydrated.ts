'use client'

import { useSyncExternalStore } from 'react'
import { useCartStore } from '@/store/cart-store'
import { useCompareStore } from '@/store/compare-store'
import { useWishlistStore } from '@/store/wishlist-store'

/** اشتراک بدون عملیات — تنها یک بار پس از mount مقدار سرور/کلاینت را جدا می‌کند */
const noopSubscribe = () => () => {}

/**
 * تشخیص پایان hydration بدون setState داخل useEffect.
 *
 * getServerSnapshot همیشه false برمی‌گرداند تا HTML سرور و اولین رندر
 * کلاینت یکسان بمانند و خطای hydration رخ ندهد.
 */
export function useHasHydrated(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true, // کلاینت
    () => false // سرور
  )
}

/** نسخهٔ اختصاصی سبد خرید — منتظر بازیابی کامل داده از LocalStorage می‌ماند */
export function useCartHydrated(): boolean {
  return useSyncExternalStore(
    (cb) => useCartStore.persist.onFinishHydration(cb),
    () => useCartStore.persist.hasHydrated(),
    () => false
  )
}

/** منتظر بازیابی لیست مقایسه از LocalStorage */
export function useCompareHydrated(): boolean {
  return useSyncExternalStore(
    (cb) => useCompareStore.persist.onFinishHydration(cb),
    () => useCompareStore.persist.hasHydrated(),
    () => false
  )
}

/** منتظر بازیابی علاقه‌مندی‌ها از LocalStorage */
export function useWishlistHydrated(): boolean {
  return useSyncExternalStore(
    (cb) => useWishlistStore.persist.onFinishHydration(cb),
    () => useWishlistStore.persist.hasHydrated(),
    () => false
  )
}
