import type { Metadata } from 'next'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import InvoiceSettingsClient from '@/components/admin/finance/invoice-settings-client'
import { requirePagePermission } from '@/lib/auth/server/page-guard'

export const metadata: Metadata = {
  title: 'تنظیمات فاکتور — مالی',
  description: 'مشخصات حقوقی، الگوی شماره، مالیات پیش‌فرض و ظاهر چاپ',
  robots: { index: false, follow: false, nocache: true },
}

export const dynamic = 'force-dynamic'

/*
  گارد اضافی: layout مادر finance/ فقط `finance:read` را می‌خواهد،
  اما تنظیمات فاکتور تغییر روی مشخصات حقوقی/شماره‌گذاری است پس
  `finance:write` لازم است. operator نباید بتواند فرمت شماره فاکتور
  را عوض کند.
*/
export default async function InvoiceSettingsPage() {
  await requirePagePermission('finance:write')
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="تنظیمات فاکتور"
        description="مشخصات صادرکننده، الگوی شماره‌گذاری و مالیات پیش‌فرض — تنظیمات چاپ"
      />
      <InvoiceSettingsClient />
    </div>
  )
}
