import type { Metadata } from 'next'
import type { ReactNode } from 'react'

/**
 * ریشهٔ بخش مدیریت.
 *
 * اینجا عمداً **هیچ گاردی نیست** — چون `/admin/login` هم زیر همین
 * مسیر است و اگر گارد اینجا بود، حلقهٔ بی‌پایان ریدایرکت می‌ساخت:
 * گارد → /admin/login → گارد → …
 *
 * ساختار:
 *   /admin/layout.tsx          ← فقط metadata (همین فایل)
 *   /admin/login/page.tsx      ← بدون گارد، ورود مدیر
 *   /admin/(panel)/layout.tsx  ← گارد + پوستهٔ پنل
 *
 * `(panel)` یک Route Group است: در URL ظاهر نمی‌شود اما اجازه
 * می‌دهد layout جداگانه‌ای فقط برای صفحات محافظت‌شده داشته باشیم.
 */
export const metadata: Metadata = {
  // هیچ صفحه‌ای از بخش مدیریت نباید ایندکس شود
  robots: { index: false, follow: false, nocache: true },
}

export default function AdminRootLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
