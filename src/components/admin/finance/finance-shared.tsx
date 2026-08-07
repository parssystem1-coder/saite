/**
 * اجزاء مشترک صفحات مالی — Stat و Badge.
 *
 * ── چرا 'use client' ندارد (فاز E) ────────────────────────────
 * Stat و Badge کاملاً pure JSX هستند. فرمت‌کننده‌های واقعی
 * (formatIRR/formatJalaliDate/formatRelative) به `src/lib/format-fa.ts`
 * منتقل شده‌اند — که این فایل هم re-export می‌کند تا 20 جای
 * فعلی که import می‌کنند تغییری نکنند.
 *
 * چرا این تغییر ارزش داشت: پنج صفحه finance و چهار صفحه reports
 * از این ماژول استفاده می‌کنند؛ همه در حالت قبل به کلاینت
 * می‌رفتند حتی اگر خودشان server component بودند. حالا فقط جایی
 * که Badge/Stat واقعاً استفاده می‌شود client می‌شود.
 */

import type { LucideIcon } from 'lucide-react'

// re-export توابع pure برای سازگاری با importهای موجود
export { formatIRR, formatJalaliDate, formatRelative } from '@/lib/format-fa'

export function Stat({
  icon: Icon,
  label,
  value,
  tone = 'default',
}: {
  icon: LucideIcon
  label: string
  value: string
  tone?: 'default' | 'success' | 'warn' | 'danger'
}) {
  const toneMap = {
    default: 'text-primary bg-primary/12',
    success: 'text-emerald-300 bg-emerald-500/12',
    warn: 'text-amber-300 bg-amber-400/12',
    danger: 'text-destructive bg-destructive/12',
  } as const
  return (
    <div className="surface-3d flex items-center gap-3 rounded-xl p-4">
      <span
        className={`flex size-10 items-center justify-center rounded-lg ${toneMap[tone]}`}
        aria-hidden
      >
        <Icon className="size-5" />
      </span>
      <div>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-lg font-semibold">{value}</div>
      </div>
    </div>
  )
}

export function Badge({
  children,
  tone = 'default',
}: {
  children: React.ReactNode
  tone?: 'default' | 'success' | 'warn' | 'danger' | 'info'
}) {
  const toneMap = {
    default: 'bg-muted text-muted-foreground',
    success: 'bg-emerald-500/15 text-emerald-300',
    warn: 'bg-amber-400/15 text-amber-300',
    danger: 'bg-destructive/15 text-destructive',
    info: 'bg-sky-500/15 text-sky-300',
  } as const
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${toneMap[tone]}`}
    >
      {children}
    </span>
  )
}
