import { redirect } from 'next/navigation'
import type { ReactNode } from 'react'
import { AdminSessionProvider } from '@/components/admin/admin-session-provider'
import { AdminShell } from '@/components/admin/admin-shell'
import { getAdminSession } from '@/lib/auth/server/admin-session'

/**
 * Layout صفحات محافظت‌شدهٔ پنل — **گارد واقعی سمت سرور**.
 *
 * ══════════════════════════════════════════════════════════════
 *  چرا گارد اینجاست و نه فقط در `proxy.ts`
 * ══════════════════════════════════════════════════════════════
 * `proxy.ts` لایهٔ اول است و درخواست را پیش از رندر می‌گیرد. اما
 * به آن تنها اعتماد نمی‌کنیم، چون:
 *
 *  • CVE-2025-29927 نشان داد لایهٔ شبکه قابل دور زدن است
 *  • تغییر `matcher` می‌تواند بی‌صدا پوشش را بردارد
 *  • در ناوبری کلاینتی (soft navigation) اصلاً اجرا نمی‌شود
 *
 * این بررسی روی سرور و پیش از تولید HTML انجام می‌شود. یعنی
 * کاربر بدون نشست **هیچ بایتی** از محتوای پنل نمی‌گیرد — نه
 * اسکلتون، نه نام ماژول‌ها، نه ساختار منو.
 *
 * تفاوت با گارد قبلی: `AdminGuard` کلاینتی بود و HTML کامل پنل
 * را می‌فرستاد، بعد در مرورگر تصمیم می‌گرفت. یعنی محتوا در
 * «view-source» قابل دیدن بود حتی برای کسی که وارد نشده.
 *
 * ── چرا `force-dynamic`؟ ──────────────────────────────────────
 * این layout به کوکی وابسته است. بدون این، Next ممکن است نسخهٔ
 * استاتیک بسازد و همان HTML را به همه بدهد.
 */

export const dynamic = 'force-dynamic'

export default async function AdminPanelLayout({ children }: { children: ReactNode }) {
  const admin = await getAdminSession()

  /*
    بدون نشست معتبر → ریدایرکت سمت سرور.

    مقصد بازگشت اینجا ست نمی‌شود چون layout مسیر دقیق صفحه را
    نمی‌داند؛ `proxy.ts` که مسیر را دارد آن را اضافه می‌کند. این
    مسیر فقط شبکهٔ ایمنی است برای وقتی که proxy اجرا نشده باشد.
  */
  if (!admin) {
    redirect('/admin/login')
  }

  return (
    <AdminSessionProvider admin={admin}>
      <AdminShell>{children}</AdminShell>
    </AdminSessionProvider>
  )
}
