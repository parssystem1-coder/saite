import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { AdminGuard } from '@/components/admin/admin-guard'
import { AdminShell } from '@/components/admin/admin-shell'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

/**
 * Layout مشترک ادمین — سایدبار یک‌بار mount می‌شود.
 * صفحات فرزند فقط محتوای main را برمی‌گردانند.
 *
 * ترتیب مهم است: گارد **بیرون** پوسته است تا کاربر بدون دسترسی
 * حتی ساختار منوی مدیریت (نام ۲۳ ماژول) را هم نبیند.
 */
export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminGuard>
      <AdminShell>{children}</AdminShell>
    </AdminGuard>
  )
}
