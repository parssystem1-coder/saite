'use client'

import { ShieldAlert } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import * as React from 'react'
import { AdminSkeleton } from '@/components/admin/admin-skeleton'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { useHasHydrated } from '@/hooks/use-has-hydrated'
import { isAdminPath } from '@/lib/auth/safe-redirect'
import { selectIsAdmin, useAuthStore } from '@/store/auth-store'

const ADMIN_LOGIN = '/admin/login'

/**
 * گارد دسترسی پنل مدیریت.
 *
 * ⚠️ این گارد «تجربهٔ کاربری» است، نه امنیت.
 * وضعیت ورود در localStorage نگهداری می‌شود و کاربر می‌تواند آن را
 * جعل کند. تنها کاری که اینجا انجام می‌شود جلوگیری از نمایش تصادفی
 * پنل به بازدیدکنندهٔ عادی است.
 *
 * ── الزام فاز بک‌اند ──────────────────────────────────────────
 * محافظت واقعی باید در دو لایه اضافه شود و این کامپوننت باقی بماند
 * تا پرش صفحه پیش از پاسخ سرور رخ ندهد:
 *
 *   ۱. `middleware.ts` در ریشه — بررسی session کوکی‌محور روی
 *      matcher `/admin/:path*` و ریدایرکت سمت سرور.
 *   ۲. هر Route Handler / Server Action ادمین — بررسی مجدد نقش.
 *      هرگز به گارد کلاینتی اعتماد نکنید.
 */
export function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const hydrated = useHasHydrated()
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn)
  const isAdmin = useAuthStore(selectIsAdmin)

  /*
    کاربر ناشناس → صفحهٔ ورود **مدیر** (نه ورود مشتریان).
    کاربر عادیِ واردشده → پیام «دسترسی ندارید» می‌بیند و ریدایرکت
    نمی‌شود، تا بفهمد چه اتفاقی افتاده.

    مسیر فعلی به‌عنوان redirect ارسال می‌شود تا پس از ورود دقیقاً
    به همان صفحه برگردد — اما فقط اگر مسیر داخلی /admin باشد
    (اعتبارسنجی در lib/auth/safe-redirect).
  */
  React.useEffect(() => {
    if (!hydrated || isLoggedIn) return
    const target = isAdminPath(pathname) ? pathname : '/admin'
    router.replace(`${ADMIN_LOGIN}?redirect=${encodeURIComponent(target)}`)
  }, [hydrated, isLoggedIn, pathname, router])

  // تا پیش از قطعی‌شدن وضعیت ورود، فقط اسکلتون — نه پوسته، نه منو
  if (!hydrated || !isLoggedIn) {
    return (
      <div className="container mx-auto px-4 py-8 md:py-10">
        <AdminSkeleton />
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="surface-3d mx-auto max-w-xl rounded-2xl">
          <EmptyState
            icon={ShieldAlert}
            title="دسترسی به پنل مدیریت ندارید"
            description="این بخش مخصوص مدیران فروشگاه است. اگر فکر می‌کنید اشتباهی رخ داده، با پشتیبانی تماس بگیرید."
            action={
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Button asChild>
                  <Link href="/dashboard">پنل کاربری من</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/">بازگشت به فروشگاه</Link>
                </Button>
              </div>
            }
          />
        </div>
      </div>
    )
  }

  return <>{children}</>
}
