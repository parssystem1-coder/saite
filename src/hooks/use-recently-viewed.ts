'use client'

import * as React from 'react'
import {
  getRecentlyViewedSnapshot,
  getServerSnapshot,
  subscribeRecentlyViewed,
  type RecentProduct,
} from '@/lib/recently-viewed'

/**
 * فهرست اخیراً دیده‌شده از sessionStorage.
 *
 * ── چرا این شکل نوشته شده؟ ────────────────────────────────────
 * نسخهٔ قبلی مستقیماً `() => getRecentlyViewed(excludeId)` را به
 * `useSyncExternalStore` می‌داد. آن تابع در هر فراخوانی یک آرایهٔ
 * **تازه** می‌ساخت (چون `filter` همیشه آرایهٔ جدید برمی‌گرداند)، پس
 * React با `Object.is` هر بار تغییر می‌دید و دوباره رندر می‌کرد —
 * حلقهٔ بی‌نهایت با این خطا:
 *
 *   The result of getSnapshot should be cached to avoid an infinite loop
 *
 * راه‌حل دو لایه است:
 *   ۱. snapshot خام در لایهٔ داده cache می‌شود (reference پایدار).
 *   ۲. فیلتر `excludeId` اینجا با useMemo انجام می‌شود — بیرون از
 *      مسیر getSnapshot، پس پایداری reference حفظ می‌شود.
 */
export function useRecentlyViewed(excludeId?: string): readonly RecentProduct[] {
  const all = React.useSyncExternalStore(
    subscribeRecentlyViewed,
    getRecentlyViewedSnapshot,
    getServerSnapshot
  )

  return React.useMemo(
    () => (excludeId ? all.filter((p) => p.id !== excludeId) : all),
    [all, excludeId]
  )
}
