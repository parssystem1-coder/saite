import type { ReactNode } from 'react'
import { AdminOperaShell } from '@/components/admin/admin-opera-shell'

export function AdminShell({ children }: { children: ReactNode }) {
  return <AdminOperaShell>{children}</AdminOperaShell>
}
