'use client'

import { useRouter } from 'next/navigation'
import * as React from 'react'
import { clearPersonalSessionData } from '@/lib/auth/session-cleanup'
import { endSessionOnCurrentDevice } from '@/lib/auth/trusted-devices'
import { useAuthStore } from '@/store/auth-store'

/**
 * خروج مشتری از حساب.
 *
 * منطق در یک جا متمرکز است تا هر نقطهٔ خروج (داشبورد، منوی هدر،
 * منوی موبایل) دقیقاً یک رفتار داشته باشد. پیش از این فقط
 * `logout()` صدا زده می‌شد و سبد خرید کاربر قبلی روی دستگاه
 * باقی می‌ماند.
 */
export function useSignOut(redirectTo = '/') {
  const router = useRouter()
  const logout = useAuthStore((s) => s.logout)
  const accountKey = useAuthStore((s) => s.user?.email || s.user?.id || '')

  return React.useCallback(() => {
    // ترتیب مهم است: اول نشانه‌گذاری نشست، بعد پاک‌سازی، بعد خروج
    if (accountKey) endSessionOnCurrentDevice(accountKey)
    clearPersonalSessionData()
    logout()
    // replace تا دکمهٔ Back به صفحهٔ محافظت‌شده برنگردد
    router.replace(redirectTo)
  }, [accountKey, logout, redirectTo, router])
}
