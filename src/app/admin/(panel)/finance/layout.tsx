import type { ReactNode } from 'react'
import { requirePagePermission } from '@/lib/auth/server/page-guard'

/**
 * گارد گروه finance — فقط ادمین‌های دارای `finance:read` می‌توانند
 * هر یک از صفحات این پوشه را ببینند.
 *
 * چرا layout و نه هر page: layout یک بار در سمت سرور اجرا می‌شود
 * و از تکرار جلوگیری می‌کند. صفحات اگر عمل نوشتاری داشتند، خود
 * جداگانه `finance:write` را چک می‌کنند.
 */
export const dynamic = 'force-dynamic'

export default async function FinanceLayout({ children }: { children: ReactNode }) {
  await requirePagePermission('finance:read')
  return <>{children}</>
}
