'use client'

import { usePathname, useRouter } from 'next/navigation'
import * as React from 'react'
import { AdminSkeleton } from '@/components/admin/admin-skeleton'
import { useHasHydrated } from '@/hooks/use-has-hydrated'
import { isAdminPath } from '@/lib/auth/safe-redirect'
import { useAdminSessionStore } from '@/store/admin-session-store'

const ADMIN_LOGIN = '/admin/login'

/**
 * گارد دسترسی پنل مدیریت.
 *
 * ⚠️ این گارد «تجربهٔ کاربری» است، نه امنیت.
 * وضعیت نشست در localStorage نگهداری می‌شود و کاربر می‌تواند آن را
 * جعل کند. تنها کاری که اینجا انجام می‌شود جلوگیری از نمایش تصادفی
 * پنل به بازدیدکنندهٔ عادی است.
 *
 * ── چرا فقط یک شرط؟ ──────────────────────────────────────────
 * پیش از این دو حالت جدا بود: «وارد نشده» و «وارد شده ولی مدیر
 * نیست». حالا نشست مدیر کاملاً جداست، پس حالت دوم بی‌معنا شده —
 * مشتری هرگز نشست مدیر ندارد و برعکس.
 *
 * ── الزام فاز بک‌اند ──────────────────────────────────────────
 * محافظت واقعی باید در دو لایه اضافه شود و این کامپوننت باقی بماند
 * تا پرش صفحه پیش از پاسخ سرور رخ ندهد:
 *
 *   ۱. `middleware.ts` در ریشه — بررسی کوکی `saite_admin_session`
 *      روی matcher `/admin/((?!login).*)`ٔ و ریدایرکت سمت سرور.
 *   ۲. هر Route Handler / Server Action ادمین — بررسی مجدد نقش.
 *      هرگز به گارد کلاینتی اعتماد نکنید.
 */
export function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const hydrated = useHasHydrated()
  const isAuthenticated = useAdminSessionStore((s) => s.isAdminAuthenticated)

  /*
    مسیر فعلی به‌عنوان redirect ارسال می‌شود تا پس از ورود دقیقاً
    به همان صفحه برگردد — اما فقط اگر مسیر داخلی /admin باشد
    (اعتبارسنجی در lib/auth/safe-redirect).
  */
  React.useEffect(() => {
    if (!hydrated || isAuthenticated) return
    const target = isAdminPath(pathname) ? pathname : '/admin'
    router.replace(`${ADMIN_LOGIN}?redirect=${encodeURIComponent(target)}`)
  }, [hydrated, isAuthenticated, pathname, router])

  // تا پیش از قطعی‌شدن وضعیت نشست، فقط اسکلتون — نه پوسته، نه منو
  if (!hydrated || !isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8 md:py-10">
        <AdminSkeleton />
      </div>
    )
  }

  return <>{children}</>
}
