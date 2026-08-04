import {
  ArrowRight,
  FileCog,
  KeyRound,
  Phone,
  ShieldCheck,
  Terminal,
  Users,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { TechText } from '@/components/ui/tech-text'
import {
  ADMIN_PASSWORD,
  ADMIN_USERNAME,
  IS_USING_DEFAULT_CREDENTIALS,
} from '@/lib/auth/server/admin-secret'
import {
  getBackendRecoveryOptions,
  getSelfServiceRecoverySteps,
  type RecoveryOption,
} from '@/lib/auth/admin-recovery'
import { IS_DEMO_MODE } from '@/lib/auth/demo-mode'

export const metadata: Metadata = {
  title: 'بازیابی دسترسی مدیر',
  description: 'راه‌های بازیابی دسترسی به پنل مدیریت',
  robots: { index: false, follow: false, nocache: true },
}

/** وابسته به متغیرهای محیطی سرور — نباید استاتیک شود */
export const dynamic = 'force-dynamic'

const ICONS: Record<RecoveryOption['icon'], LucideIcon> = {
  terminal: Terminal,
  file: FileCog,
  users: Users,
  phone: Phone,
  shield: ShieldCheck,
}

function RecoveryList({ options }: { options: RecoveryOption[] }) {
  return (
    <ol className="space-y-4">
      {options.map((option, index) => {
        const Icon = ICONS[option.icon]
        return (
          <li
            key={option.title}
            className="rounded-xl border border-border bg-surface-0/50 p-5"
          >
            <div className="flex items-start gap-4">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/12 text-xs font-black text-primary">
                {index + 1}
              </span>

              <div className="min-w-0 flex-1">
                <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">
                  <Icon className="size-4 shrink-0 text-primary" aria-hidden="true" />
                  {option.title}
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                  {option.description}
                </p>

                {option.code && (
                  <pre
                    dir="ltr"
                    className="scrollbar-neon mt-3 overflow-x-auto rounded-lg border border-border bg-surface-0 p-3 text-left font-mono text-[11px] leading-relaxed text-foreground"
                  >
                    {option.code}
                  </pre>
                )}

                {option.action && (
                  <Button variant="outline" size="sm" className="mt-3" asChild>
                    <a href={option.action.href} dir="ltr">
                      {option.action.label}
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </li>
        )
      })}
    </ol>
  )
}

/**
 * بازیابی دسترسی مدیر.
 *
 * برخلاف `/forgot-password` مشتریان، اینجا فرم خودکار نیست —
 * دلیل کامل در `lib/auth/admin-recovery` مستند شده.
 *
 * صفحه دو حالت دارد:
 *  • در توسعه: راهنمای عملی خواندن/تغییر اعتبارنامه از فایل
 *  • در production: گزینه‌های بازیابی سمت سرور
 */
export default function AdminRecoverPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-surface-0 px-4 py-10">
      <div className="w-full max-w-2xl">
        <div className="surface-3d rounded-2xl border border-border p-7 md:p-9">
          <header className="mb-8">
            <span className="mb-4 inline-flex size-12 items-center justify-center rounded-xl border border-primary/30 bg-primary/12">
              <KeyRound className="size-6 text-primary" aria-hidden="true" />
            </span>
            <h1 className="text-xl font-black text-foreground md:text-2xl">
              بازیابی دسترسی مدیر
            </h1>
            <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
              {IS_DEMO_MODE
                ? 'بک‌اند هنوز متصل نیست، پس اعتبارنامه در فایل تنظیمات پروژه است — نه در دیتابیس. با مراحل زیر آن را ببینید یا عوض کنید.'
                : 'حساب مدیر بازیابی خودکار ایمیلی ندارد. یکی از راه‌های زیر را انتخاب کنید.'}
            </p>
          </header>

          {IS_DEMO_MODE ? (
            <>
              {/* اعتبارنامهٔ فعلی — سریع‌ترین پاسخ به «فراموش کردم» */}
              <div className="mb-7 rounded-xl border border-stock-in/25 bg-stock-in/8 p-5">
                <p className="text-xs font-bold text-stock-in">
                  اعتبارنامهٔ فعلی شما (فقط در محیط توسعه)
                </p>
                <dl className="mt-3 space-y-2 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-muted-foreground">نام کاربری</dt>
                    <dd>
                      <TechText className="rounded-md border border-border bg-surface-0 px-2.5 py-1 font-bold text-foreground">
                        {ADMIN_USERNAME}
                      </TechText>
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-muted-foreground">رمز عبور</dt>
                    <dd>
                      <TechText className="rounded-md border border-border bg-surface-0 px-2.5 py-1 font-bold text-foreground">
                        {ADMIN_PASSWORD}
                      </TechText>
                    </dd>
                  </div>
                </dl>

                {!IS_USING_DEFAULT_CREDENTIALS && (
                  <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
                    این مقادیر از فایل <TechText>.env.local</TechText> خوانده شده‌اند.
                  </p>
                )}
              </div>

              <h2 className="mb-4 text-sm font-bold text-foreground">
                اگر می‌خواهید مقدار را عوض کنید
              </h2>
              <RecoveryList options={getSelfServiceRecoverySteps()} />

              <div className="mt-7 rounded-xl border border-stock-low/25 bg-stock-low/8 p-4">
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  <span className="font-bold text-stock-low">پس از اتصال بک‌اند:</span> رمز
                  هش‌شده در دیتابیس ذخیره می‌شود و دیگر از فایل قابل خواندن نیست. آن‌وقت
                  دستور <TechText>npm run admin:reset-password</TechText> یا کدهای بازیابی
                  یک‌بارمصرف جایگزین این روش می‌شوند.
                </p>
              </div>
            </>
          ) : (
            <RecoveryList options={getBackendRecoveryOptions()} />
          )}

          <nav className="mt-7 border-t border-border pt-5">
            <Link
              href="/admin/login"
              className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowRight className="size-3.5" aria-hidden="true" />
              بازگشت به صفحهٔ ورود مدیر
            </Link>
          </nav>
        </div>

        <p className="mt-5 text-center text-[11px] leading-relaxed text-muted-foreground/70">
          درخواست‌های بازیابی ثبت و بررسی می‌شوند.
        </p>
      </div>
    </div>
  )
}
