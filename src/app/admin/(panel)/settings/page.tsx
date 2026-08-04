import type { Metadata } from 'next'
import { AdminAccountSettings } from '@/components/admin/admin-account-settings'
import { AdminPageHeader } from '@/components/admin/admin-page-header'

export const metadata: Metadata = {
  title: 'تنظیمات',
  description: 'پیکربندی فروشگاه و حساب مدیر',
  robots: { index: false, follow: false, nocache: true },
}

/** Server Page + Client island — فقط فرم‌ها تعاملی‌اند */
export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="تنظیمات"
        description="حساب مدیر، امنیت و پیکربندی فروشگاه"
      />

      <AdminAccountSettings />
    </div>
  )
}
