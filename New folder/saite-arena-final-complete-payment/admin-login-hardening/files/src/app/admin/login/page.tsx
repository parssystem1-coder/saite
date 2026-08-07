import { ArrowRight, Lock, ScrollText, ShieldCheck, Terminal } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { AdminLoginForm } from '@/components/admin/admin-login-form'
import { Skeleton } from '@/components/ui/skeleton'
import { TechText } from '@/components/ui/tech-text'
import { hasAdminSession } from '@/lib/auth/server/admin-session'
import { SITE } from '@/lib/constants'

/**
 * صفحه ورود مدیر، بدون هیچ دادهٔ محرمانه در HTML یا باندل کلاینت.
 *
 * مرز امنیتی این صفحه:
 * - هیچ رمز، نام کاربری، secret یا flag دمو از سرور به JSX نمی‌آید.
 * - نشست فقط با hasAdminSession روی سرور بررسی می‌شود.
 * - مقصد بعد از ورود در AdminLoginForm با allowlist مسیرهای داخلی کنترل می‌شود.
 * - فرم اعتبارسنجی اعتبارنامه را انجام نمی‌دهد؛ فقط به endpoint سرور درخواست می‌فرستد.
 *
 * این صفحه به‌تنهایی جای proxy، layout محافظت‌شده و Route Handler را نمی‌گیرد.
 */

export const metadata: Metadata = {
  title: 'ورود مدیر',
  description: 'ورود امن به پنل مدیریت فروشگاه',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    noarchive: true,
    nosnippet: true,
  },
}

/** صفحه به کوکی نشست وابسته است و نباید استاتیک یا قابل کش عمومی شود. */
export const dynamic = 'force-dynamic'
export const revalidate = 0

const SECURITY_NOTES = [
  { icon: Lock, text: 'نشست مدیر با کوکی HttpOnly و SameSite=Strict نگهداری می‌شود' },
  { icon: ScrollText, text: 'تلاش‌های ورود و رویدادهای مشکوک در سمت سرور ثبت می‌شوند' },
  { icon: ShieldCheck, text: 'ورود چندمرحله‌ای و محدودیت نرخ در endpoint سرور اعمال می‌شود' },
]

export default async function AdminLoginPage() {
  // جلوگیری از نمایش فرم برای مدیری که نشست معتبر دارد.
  if (await hasAdminSession()) redirect('/admin')

  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-surface-0 px-4 py-10">
      <div
        className="w-full max-w-4xl overflow-hidden rounded-2xl border border-border shadow-depth-4"
        data-auth-surface="admin-login"
      >
        <div className="grid grid-cols-1 md:grid-cols-[1.1fr_1fr]">
          <aside
            aria-label="اطلاعات امنیتی پنل مدیریت"
            className="relative hidden flex-col justify-between bg-primary-deep/25 p-9 md:flex"
          >
            <div aria-hidden="true" className="absolute inset-0 bg-linear-to-br from-primary/18 to-transparent" />

            <div className="relative z-10">
              <div className="flex items-center gap-2.5">
                <span className="flex size-10 items-center justify-center rounded-xl border border-primary/40 bg-primary/20">
                  <Terminal className="size-5 text-primary-bright" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-black text-foreground">{SITE.name}</p>
                  <TechText className="text-[10px] tracking-widest text-primary-bright uppercase">
                    admin console
                  </TechText>
                </div>
              </div>

              <h1 className="mt-10 text-xl leading-relaxed font-black text-balance text-foreground">
                ناحیهٔ مدیریت
                <br />
                <span className="text-primary-bright">دسترسی محدود</span>
              </h1>
              <p className="mt-3 max-w-xs text-xs leading-relaxed text-muted-foreground">
                این بخش جدا از حساب مشتریان است و فقط برای مدیران مجاز فروشگاه تعریف شده.
              </p>
            </div>

            <ul className="relative z-10 mt-10 space-y-3.5">
              {SECURITY_NOTES.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-start gap-2.5">
                  <Icon className="mt-0.5 size-3.5 shrink-0 text-primary-bright" aria-hidden="true" />
                  <span className="text-[11px] leading-relaxed text-muted-foreground">{text}</span>
                </li>
              ))}
            </ul>
          </aside>

          <section aria-labelledby="admin-login-title" className="bg-surface-1 p-7 md:p-9">
            <header className="mb-7">
              <TechText className="mb-3 inline-flex items-center gap-1.5 rounded-md border border-primary/30 bg-primary/10 px-2 py-1 text-[10px] tracking-widest text-primary uppercase">
                <Lock className="size-3" aria-hidden="true" />
                restricted area
              </TechText>
              <h2 id="admin-login-title" className="text-xl font-black text-foreground md:text-2xl">
                ورود مدیر سیستم
              </h2>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                برای ادامه، اطلاعات دسترسی مدیر را وارد کنید.
              </p>
            </header>

            <Suspense fallback={<Skeleton className="h-64 w-full rounded-xl" />}>
              <AdminLoginForm />
            </Suspense>

            <nav aria-label="پیوندهای صفحه ورود" className="mt-6 flex items-center justify-between border-t border-border pt-5 text-[11px]">
              <Link
                href="/"
                className="flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
              >
                <ArrowRight className="size-3.5" aria-hidden="true" />
                بازگشت به فروشگاه
              </Link>
              <Link
                href="/login"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                ورود مشتریان
              </Link>
            </nav>
          </section>
        </div>
      </div>
    </main>
  )
}
