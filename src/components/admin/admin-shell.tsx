import type { ReactNode } from 'react'
import { AdminOperaShell } from '@/components/admin/admin-opera-shell'

/**
 * پوستهٔ مشترک همهٔ صفحات ادمین — نگهدار wrapper برای سازگاری.
 * منطق واقعی در AdminOperaShell است تا layout سرور بدون تغییر بماند.
 */
export function AdminShell({ children }: { children: ReactNode }) {
  return <AdminOperaShell>{children}</AdminOperaShell>
}
