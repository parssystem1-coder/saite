'use client'

import { useSyncExternalStore } from 'react'
import { useCartStore } from '@/store/cart-store'

/** اشتراک بدون عملیات — تنها یک بار پس از mount مقدار سرور/کلاینت را جدا می‌کند */
const noopSubscribe = () => () => {}

/**
 * تشخیص پایان hydration بدون setState داخل useEffect.
 *
 * الگوی قبلی پروژه (`useState(false)` + `useEffect(() => setMounted(true))`)
 * در پنج فایل تکرار شده بود و قاعدهٔ react-hooks/set-state-in-effect در
 * React 19 آن را خطا اعلام می‌کند، چون باعث رندر آبشاری می‌شود.
 *
 * useSyncExternalStore این کار را بدون رندر اضافی انجام می‌دهد:
 * getServerSnapshot همیشه false برمی‌گرداند، پس HTML سرور و اولین رندر
 * کلاینت یکسان می‌مانند و خطای hydration رخ نمی‌دهد.
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
