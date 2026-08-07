import type { Metadata } from 'next'
import Link from 'next/link'
import { ShieldAlert } from 'lucide-react'
import { getAdminSession } from '@/lib/auth/server/admin-session'
import { roleLabel } from '@/lib/auth/rbac'

export const metadata: Metadata = {
  title: 'دسترسی محدود',
  description: 'شما مجوز دسترسی به این بخش را ندارید',
  robots: { index: false, follow: false, nocache: true },
}

export const dynamic = 'force-dynamic'

/**
 * صفحهٔ 403 داخلی پنل ادمین.
 *
 * چرا داخل (panel) و نه در ریشه: تا layout و سایدبار حفظ شوند و
 * کاربر بتواند به بخش‌های مجاز خودش برگردد بدون بازگشت به
 * صفحهٔ اصلی.
 */
export default async function ForbiddenPage() {
  const admin = await getAdminSession()
  return (
    <div className="mx-auto max-w-md space-y-6 py-10 text-center">
      <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-destructive/12">
        <ShieldAlert className="size-8 text-destructive" aria-hidden />
      </div>
      <div>
        <h1 className="mb-2 text-xl font-black text-foreground">دسترسی محدود</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          شما مجوز مشاهدهٔ این بخش را ندارید. اگر این محدودیت اشتباه است، با مدیر کل
          سیستم تماس بگیرید.
        </p>
        {admin && (
          <p className="mt-3 text-xs text-muted-foreground">
            نقش فعلی شما: <span className="font-semibold text-foreground">{roleLabel(admin.role)}</span>
          </p>
        )}
      </div>
      <Link
        href="/admin"
        className="inline-flex items-center rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
      >
        بازگشت به داشبورد
      </Link>
    </div>
  )
}
