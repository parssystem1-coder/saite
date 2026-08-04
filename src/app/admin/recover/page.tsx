import { ArrowRight, KeyRound, Phone, ShieldCheck, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { getAdminRecoveryOptions, type RecoveryOption } from '@/lib/auth/admin-recovery'
import { IS_DEMO_MODE } from '@/lib/auth/demo-mode'
import { DEMO_ADMIN_PASSWORD, DEMO_ADMIN_USERNAME } from '@/lib/auth/admin-credentials'
import { TechText } from '@/components/ui/tech-text'

export const metadata: Metadata = {
  title: 'بازیابی دسترسی مدیر',
  description: 'راه‌های بازیابی دسترسی به پنل مدیریت',
  robots: { index: false, follow: false, nocache: true },
}

const ICONS: Record<RecoveryOption['icon'], LucideIcon> = {
  users: Users,
  phone: Phone,
  shield: ShieldCheck,
}

/**
 * بازیابی دسترسی مدیر.
 *
 * برخلاف `/forgot-password` مشتریان، اینجا فرم خودکار نیست —
 * دلیل کامل در `lib/auth/admin-recovery` مستند شده. خلاصه:
 * لینک بازیابی ایمیلی، صندوق ایمیل مدیر را به کلید کل فروشگاه
 * تبدیل می‌کند.
 */
export default function AdminRecoverPage() {
  const options = getAdminRecoveryOptions()

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
              حساب مدیر بازیابی خودکار ندارد. یکی از راه‌های زیر را انتخاب کنید.
            </p>
          </header>

          <ul className="space-y-4">
            {options.map((option) => {
              const Icon = ICONS[option.icon]
              return (
                <li
                  key={option.title}
                  className="flex flex-wrap items-start gap-4 rounded-xl border border-border bg-surface-0/50 p-5"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/12">
                    <Icon className="size-5 text-primary" aria-hidden="true" />
                  </span>

                  <div className="min-w-0 flex-1">
                    <h2 className="text-sm font-bold text-foreground">{option.title}</h2>
                    <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                      {option.description}
                    </p>

                    {option.action && (
                      <Button variant="outline" size="sm" className="mt-3.5" asChild>
                        <a href={option.action.href} dir="ltr">
                          {option.action.label}
                        </a>
                      </Button>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>

          {/* راهنمای توسعه — در بیلد production حذف می‌شود */}
          {IS_DEMO_MODE && (
            <div className="mt-6 rounded-lg border border-stock-low/25 bg-stock-low/8 px-3.5 py-3">
              <p className="text-[10px] font-bold tracking-wide text-stock-low">
                محیط توسعه — اعتبارنامهٔ فعلی
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
