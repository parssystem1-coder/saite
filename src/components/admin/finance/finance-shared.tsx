/**
 * اجزاء مشترک ۵ صفحهٔ مالی — Stat، فرمت‌کننده‌های پول/تاریخ، بج وضعیت.
 *
 * چرا اینجا: پنج فایل صفحه تقریباً همین چهار المان را می‌سازند؛
 * تکرارش یعنی وقتی رنگ یک بج عوض می‌شود، باید ۵ جا اصلاح کنیم.
 */
'use client'

import * as React from 'react'
import type { LucideIcon } from 'lucide-react'

/** فرمت پول ریال — همیشه با اعداد فارسی و جداکنندهٔ سه‌رقمی */
export function formatIRR(amount: number): string {
  return `${amount.toLocaleString('fa-IR')} ﷼`
}

/** ISO → «۱۴۰۳/۰۵/۱۶» */
export function formatJalaliDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date(iso))
  } catch {
    return '—'
  }
}

/** ISO → «۳ روز پیش» */
export function formatRelative(iso: string): string {
  try {
    const diff = Date.now() - new Date(iso).getTime()
    const days = Math.floor(diff / 86400000)
    if (days === 0) return 'امروز'
    if (days < 0) return `${(-days).toLocaleString('fa-IR')} روز مانده`
    if (days < 30) return `${days.toLocaleString('fa-IR')} روز پیش`
    const months = Math.floor(days / 30)
    return `${months.toLocaleString('fa-IR')} ماه پیش`
  } catch {
    return '—'
  }
}

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
