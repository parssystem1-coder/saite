'use client'

import * as React from 'react'
import { useAdminSessionStore } from '@/store/admin-session-store'
import type { AdminUser } from '@/types/user'

/**
 * تزریق نشست سرور به store کلاینت.
 *
 * ── چرا این کامپوننت لازم است ─────────────────────────────────
 * نشست در کوکی `httpOnly` است، پس کلاینت نمی‌تواند آن را بخواند.
 * اما سایدبار و نوار نشست باید نام مدیر را نشان دهند.
 *
 * راه‌حل: Server Component نشست را می‌خواند و پروفایل عمومی را
 * (فقط id، نام، ایمیل، نقش — هیچ توکنی) به این کامپوننت می‌دهد.
 *
 * ── چرا مقداردهی در رندر و نه در `useEffect`؟ ─────────────────
 * اگر در effect بود، اولین رندر کلاینت `status: 'unknown'` می‌دید
 * و اسکلتون نشان می‌داد — یک پرش بی‌دلیل برای کاربری که سرور
 * قبلاً تأییدش کرده. مقداردهی همگام در بدنهٔ رندر این را حذف
 * می‌کند.
 *
 * الگوی امن Zustand برای این کار: `setState` مستقیم روی store
 * خارج از چرخهٔ رندر React است، پس `useState` را در جریان رندر
 * دستکاری نمی‌کند.
 */
export function AdminSessionProvider({
  admin,
  children,
}: {
  admin: AdminUser | null
  children: React.ReactNode
}) {
  /*
    همگام‌سازی یک‌باره پیش از اولین رندر فرزندان.

    شرط برابری لازم است تا در هر رندر دوباره set نشود و حلقهٔ
    بی‌نهایت نسازد — همان اشتباهی که قبلاً در getRecentlyViewed رخ
    داد و باعث خطای «getSnapshot should be cached» شد.
  */
  const current = useAdminSessionStore.getState()
  const expectedStatus = admin ? 'authenticated' : 'anonymous'

  if (current.status !== expectedStatus || current.admin?.id !== admin?.id) {
    useAdminSessionStore.setState({
      admin,
      status: expectedStatus,
      isAdminAuthenticated: admin !== null,
    })
  }

  /*
    اگر prop عوض شد (مثلاً پس از ناوبری سرور با نشست جدید)،
    دوباره همگام کن.
  */
  React.useEffect(() => {
    useAdminSessionStore.getState().setAdmin(admin)
  }, [admin])

  return <>{children}</>
}
