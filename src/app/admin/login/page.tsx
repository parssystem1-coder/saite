import { ArrowRight, Lock, ScrollText, ShieldCheck, Terminal } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { AdminLoginForm } from '@/components/admin/admin-login-form'
import { Skeleton } from '@/components/ui/skeleton'
import { TechText } from '@/components/ui/tech-text'
import { DEMO_ADMIN_PASSWORD, DEMO_ADMIN_USERNAME } from '@/lib/auth/admin-credentials'
import { IS_DEMO_MODE } from '@/lib/auth/demo-mode'
import { SITE } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'ورود مدیر',
  description: 'ورود به پنل مدیریت فروشگاه',
  robots: { index: false, follow: false, nocache: true },
}

const SECURITY_NOTES = [
  { icon: Lock, text: 'اتصال رمزنگاری‌شده و نشست مجزا از حساب مشتریان' },
  { icon: ScrollText, text: 'زمان، نشانی IP و دستگاه هر ورود ثبت می‌شود' },
  { icon: ShieldCheck, text: 'پس از چند تلاش ناموفق، ورود موقتاً قفل می‌شود' },
]

/**
 * ورود مدیر — Server Page + Client island.
 *
 * ── چرا طراحی عمداً متفاوت است؟ ───────────────────────────────
 * صفحهٔ ورود مشتری «دعوت‌کننده» است: کارت شناور وسط صفحه، هالهٔ
 * رنگی، لینک ثبت‌نام. آن زبان بصری برای فروش درست است.
 *
 * این صفحه باید حس «ناحیهٔ محدود» بدهد، نه «خوش آمدید»:
 *   • چیدمان دوستونی اداری به‌جای کارت شناور تک‌ستونه
 *   • ستون کنارِ سرمه‌ای با یادآوری‌های امنیتی
 *   • بدون هاله و انیمیشن تزئینی
 *   • تایپوگرافی فنی (font-mono) برای برچسب ناحیه
 *
 * کاربری که اشتباهی اینجا آمده، از روی ظاهر می‌فهمد جای درستی
 * نیست — پیش از آنکه فرم را پر کند.
 */
export default function AdminLoginPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-surface-0 px-4 py-10">
      <div className="w-full max-w-4xl overflow-hidden rounded-2xl border border-border shadow-depth-4">
        <div className="grid grid-cols-1 md:grid-cols-[1.1fr_1fr]">
          {/* ── ستون هویت و هشدار امنیتی ───────────────────── */}
          <aside className="relative hidden flex-col justify-between bg-primary-deep/25 p-9 md:flex">
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-linear-to-br from-primary/18 to-transparent"
            />

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

              <h2 className="mt-10 text-xl leading-relaxed font-black text-balance text-foreground">
                ناحیهٔ مدیریت
                <br />
                <span className="text-primary-bright">دسترسی محدود</span>
              </h2>
              <p className="mt-3 max-w-xs text-xs leading-relaxed text-muted-foreground">
                این بخش جدا از حساب مشتریان است و فقط برای مدیران فروشگاه تعریف شده.
              </p>
            </div>

            <ul className="relative z-10 mt-10 space-y-3.5">
              {SECURITY_NOTES.map((note) => (
                <li key={note.text} className="flex items-start gap-2.5">
                  <note.icon
                    className="mt-0.5 size-3.5 shrink-0 text-primary-bright"
                    aria-hidden="true"
                  />
                  <span className="text-[11px] leading-relaxed text-muted-foreground">
                    {note.text}
                  </span>
                </li>
              ))}
            </ul>
          </aside>

          {/* ── ستون فرم ───────────────────────────────────── */}
          <div className="bg-surface-1 p-7 md:p-9">
            <header className="mb-7">
              {/* برچسب ناحیه — روی موبایل جای ستون کناری را می‌گیرد */}
              <TechText className="mb-3 inline-flex items-center gap-1.5 rounded-md border border-primary/30 bg-primary/10 px-2 py-1 text-[10px] tracking-widest text-primary uppercase">
                <Lock className="size-3" aria-hidden="true" />
                restricted area
              </TechText>
              <h1 className="text-xl font-black text-foreground md:text-2xl">
                ورود مدیر سیستم
              </h1>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                اطلاعات ورود از «تنظیمات ← حساب مدیر» قابل تغییر است.
              </p>
            </header>

            <Suspense fallback={<Skeleton className="h-64 w-full rounded-xl" />}>
              <AdminLoginForm />
            </Suspense>

            {/*
              راهنمای فاز پوسته — فقط در توسعهٔ محلی.
              با `next build` این بلوک کاملاً از باندل حذف می‌شود،
              پس اعتبارنامه هرگز روی هاست عمومی دیده نمی‌شود.
            */}
            {IS_DEMO_MODE && (
              <div className="mt-6 rounded-lg border border-stock-low/25 bg-stock-low/8 px-3.5 py-3">
                <p className="text-[10px] font-bold tracking-wide text-stock-low">
                  محیط توسعه — این بخش در نسخهٔ منتشرشده نمایش داده نمی‌شود
                </p>
                <dl className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <dt className="text-muted-foreground">کاربر:</dt>
                    <dd>
                      <TechText className="font-bold text-foreground">
                        {DEMO_ADMIN_USERNAME}
                      </TechText>
                    </dd>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <dt className="text-muted-foreground">رمز:</dt>
                    <dd>
                      <TechText className="font-bold text-foreground">
                        {DEMO_ADMIN_PASSWORD}
                      </TechText>
                    </dd>
                  </div>
                </dl>
              </div>
            )}

            <nav className="mt-6 flex items-center justify-between border-t border-border pt-5 text-[11px]">
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
          </div>
        </div>
      </div>
    </div>
  )
}
