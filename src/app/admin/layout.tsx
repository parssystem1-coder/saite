import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { AdminShell } from '@/components/admin/admin-shell'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

/**
 * Layout مشترک ادمین — سایدبار یک‌بار mount می‌شود.
 * صفحات فرزند فقط محتوای main را برمی‌گردانند.
 */
export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AdminShell>{children}</AdminShell>
}
