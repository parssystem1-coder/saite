import { ArrowRight, ShieldCheck } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { AdminLoginForm } from '@/components/admin/admin-login-form'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DEMO_ADMIN_PASSWORD,
  DEMO_ADMIN_USERNAME,
} from '@/lib/auth/admin-credentials'
import { SITE } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'ورود مدیر',
  description: 'ورود به پنل مدیریت فروشگاه',
  // صفحهٔ ورود مدیر نباید در نتایج جستجو دیده شود
  robots: { index: false, follow: false, nocache: true },
}

/**
 * ورود مدیر — Server Page + Client island.
 *
 * چرا مسیر جدا از `/login`؟
 * مسیر `/login` صفحهٔ مشتریان است و لینک ثبت‌نام دارد. مدیر با
 * ثبت‌نام عمومی ساخته نمی‌شود، پس نمایش آن فرم به او هم گمراه‌کننده
 * است و هم سطح حمله را بی‌دلیل بزرگ می‌کند.
 */
export default function AdminLoginPage() {
  return (
    <div className="flex min-h-[85vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="surface-3d relative overflow-hidden rounded-3xl border border-border px-7 py-9 shadow-depth-4 md:px-9">
          <div
            aria-hidden="true"
            className="absolute -top-24 left-1/2 size-64 -translate-x-1/2 rounded-full bg-primary/15 blur-[90px]"
          />

          <div className="relative z-10">
            <header className="mb-8 text-center">
              <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl border border-primary/30 bg-primary/12">
                <ShieldCheck className="size-7 text-primary" aria-hidden="true" />
              </div>
              <h1 className="text-2xl font-black tracking-tight text-foreground">
                ورود به پنل مدیریت
              </h1>
              <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
                این بخش مخصوص مدیران {SITE.name} است. اطلاعات ورود از «تنظیمات ← کاربران»
                مدیریت می‌شود.
              </p>
            </header>

            <Suspense fallback={<Skeleton className="h-72 w-full rounded-2xl" />}>
              <AdminLoginForm />
            </Suspense>

            {/*
              راهنمای فاز پوسته — با اتصال بک‌اند این بلوک حذف می‌شود.
              عمداً واضح نوشته شده تا کسی آن را «رمز واقعی» نپندارد.
            */}
            <div className="mt-7 rounded-xl border border-stock-low/25 bg-stock-low/8 p-3.5">
              <p className="text-[11px] font-bold text-stock-low">نسخهٔ نمایشی</p>
              <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
                بک‌اند هنوز متصل نیست. برای بازدید پنل:
              </p>
              <dl className="mt-2 space-y-1 text-[11px]">
                <div className="flex items-center gap-2">
                  <dt className="text-muted-foreground">نام کاربری:</dt>
                  <dd dir="ltr" className="font-mono font-bold text-foreground">
                    {DEMO_ADMIN_USERNAME}
                  </dd>
                </div>
                <div className="flex items-center gap-2">
                  <dt className="text-muted-foreground">رمز عبور:</dt>
                  <dd dir="ltr" className="font-mono font-bold text-foreground">
                    {DEMO_ADMIN_PASSWORD}
                  </dd>
                </div>
              </dl>
            </div>

            <nav className="mt-6 flex items-center justify-center gap-4 border-t border-border pt-5 text-xs">
              <Link
                href="/"
                className="flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
              >
                <ArrowRight className="size-3.5" aria-hidden="true" />
                بازگشت به فروشگاه
              </Link>
              <span aria-hidden="true" className="text-muted-foreground/30">
                |
              </span>
              <Link
                href="/login"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                ورود مشتریان
              </Link>
            </nav>
          </div>
        </div>

        <p className="mt-5 text-center text-[11px] leading-relaxed text-muted-foreground/70">
          تلاش‌های ورود ثبت می‌شود. دسترسی غیرمجاز پیگرد قانونی دارد.
        </p>
      </div>
    </div>
  )
}
