'use client'

import { useSyncExternalStore } from 'react'
import {
  getRecentlyViewed,
  subscribeRecentlyViewed,
  type RecentProduct,
} from '@/lib/recently-viewed'

const empty: RecentProduct[] = []

/**
 * فهرست اخیراً دیده‌شده از sessionStorage.
 * سرور همیشه [] تا hydration mismatch نشود.
 */
export function useRecentlyViewed(excludeId?: string): RecentProduct[] {
  return useSyncExternalStore(
    subscribeRecentlyViewed,
    () => getRecentlyViewed(excludeId),
    () => empty
  )
}
