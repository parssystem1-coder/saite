import type { ReactNode } from 'react'
import { requirePagePermission } from '@/lib/auth/server/page-guard'

/**
 * گارد گروه settings — فقط ادمین‌های دارای `settings:write` می‌توانند
 * تنظیمات را ببینند و ویرایش کنند.
 *
 * چرا `settings:write` و نه `settings:read`: قصد ما این است که
 * viewer/operator اصلاً تنظیمات فروشگاه، شرکت‌های حمل و درگاه‌های
 * پرداخت را نبینند چون شامل داده‌های حساس (توکن API، شمارهٔ کارت
 * سازمانی و…) می‌شوند.
 */
export const dynamic = 'force-dynamic'

export default async function SettingsLayout({ children }: { children: ReactNode }) {
  await requirePagePermission('settings:write')
  return <>{children}</>
}
