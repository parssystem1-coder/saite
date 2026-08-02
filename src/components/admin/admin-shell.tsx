import type { ReactNode } from 'react'
import { AdminSidebar } from '@/components/admin/admin-sidebar'

/**
 * پوستهٔ مشترک همهٔ صفحات ادمین.
 * سایدبار یک‌بار در layout می‌آید؛ صفحات فقط children را پر می‌کنند.
 */
export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <div className="container mx-auto px-4 py-8 md:py-10">
      <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
        <AdminSidebar />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  )
}
