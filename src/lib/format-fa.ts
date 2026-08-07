/**
 * فرمت‌کننده‌های فارسی — pure، بدون React، بدون client.
 *
 * ── چرا این فایل جدا از src/lib/format.ts ────────────────────
 * `format.ts` توابع مربوط به قیمت/عدد دارد که از قبل موجودند.
 * این فایل توابع تاریخ و پول ادمین را در بر می‌گیرد که در فاز A
 * داخل `finance-shared.tsx` تعریف شده بودند. با جدا کردن آن‌ها
 * از کامپوننت‌های Client:
 *
 *   • Server Componentها می‌توانند مستقیم import کنند بدون
 *     پرداختن هزینهٔ 'use client'
 *   • تست‌های واحد pure هستند (بدون jsdom)
 *   • هیچ کامپوننتی به‌خاطر یک تابع کوچک client نمی‌شود
 */

/** فرمت پول ریال — همیشه با اعداد فارسی و جداکنندهٔ سه‌رقمی */
export function formatIRR(amount: number): string {
  return `${amount.toLocaleString('fa-IR')} ﷼`
}

/** ISO → «۱۴۰۳/۰۵/۱۶» با تقویم خورشیدی */
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

/**
 * ISO → «۳ روز پیش» / «۵ روز مانده».
 *
 * ⚠️ این تابع به `Date.now()` وابسته است. اگر داخل `useMemo`
 * صدا زده شود، React 19 خطای impure-function می‌دهد. برای
 * استفاده در Client Component، nowMs را از `React.useState(() => Date.now())`
 * بگیرید و پاس دهید — یا از این helper در سرور استفاده کنید.
 */
export function formatRelative(iso: string, nowMs: number = Date.now()): string {
  try {
    const diff = nowMs - new Date(iso).getTime()
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
