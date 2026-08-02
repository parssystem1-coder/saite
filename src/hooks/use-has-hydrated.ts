'use client'

import { useSyncExternalStore } from 'react'
import { useCartStore } from '@/store/cart-store'
import { useCompareStore } from '@/store/compare-store'
import { useWishlistStore } from '@/store/wishlist-store'

/** اشتراک بدون عملیات — تنها یک بار پس از mount مقدار سرور/کلاینت را جدا می‌کند */
const noopSubscribe = () => () => {}

/**
 * Zustand persist: اگر hydration قبلاً تمام شده، onFinishHydration دیگر fire نمی‌کند.
 * پس subscribe باید در صورت hasHydrated فوری callback بزند.
 */
function subscribePersistHydration(
  api: {
    persist: {
      hasHydrated: () => boolean
      onFinishHydration: (cb: () => void) => () => void
    }
  },
  onStoreChange: () => void
): () => void {
  if (api.persist.hasHydrated()) {
    queueMicrotask(onStoreChange)
    return () => {}
  }
  return api.persist.onFinishHydration(onStoreChange)
}

/**
 * تشخیص پایان hydration بدون setState داخل useEffect.
 * getServerSnapshot همیشه false — HTML سرور و اولین رندر کلاینت یکسان می‌مانند.
 */
export function useHasHydrated(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false
  )
}

/** منتظر بازیابی سبد از LocalStorage */
export function useCartHydrated(): boolean {
  return useSyncExternalStore(
    (cb) => subscribePersistHydration(useCartStore, cb),
    () => useCartStore.persist.hasHydrated(),
    () => false
  )
}

/** منتظر بازیابی لیست مقایسه از LocalStorage */
export function useCompareHydrated(): boolean {
  return useSyncExternalStore(
    (cb) => subscribePersistHydration(useCompareStore, cb),
    () => useCompareStore.persist.hasHydrated(),
    () => false
  )
}

/** منتظر بازیابی علاقه‌مندی‌ها از LocalStorage */
export function useWishlistHydrated(): boolean {
  return useSyncExternalStore(
    (cb) => subscribePersistHydration(useWishlistStore, cb),
    () => useWishlistStore.persist.hasHydrated(),
    () => false
  )
}
