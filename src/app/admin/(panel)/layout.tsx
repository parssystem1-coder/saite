import type { ReactNode } from 'react'
import { AdminGuard } from '@/components/admin/admin-guard'
import { AdminShell } from '@/components/admin/admin-shell'

/**
 * Layout صفحات محافظت‌شدهٔ پنل — سایدبار یک‌بار mount می‌شود.
 * صفحات فرزند فقط محتوای main را برمی‌گردانند.
 *
 * ترتیب مهم است: گارد **بیرون** پوسته است تا کاربر بدون دسترسی
 * حتی ساختار منوی مدیریت (نام ۲۳ ماژول) را هم نبیند.
 *
 * `/admin/login` عمداً بیرون از این گروه است تا گارد آن را نگیرد.
 */
export default function AdminPanelLayout({ children }: { children: ReactNode }) {
  return (
    <AdminGuard>
      <AdminShell>{children}</AdminShell>
    </AdminGuard>
  )
}
