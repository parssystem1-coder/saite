import type { Metadata } from 'next'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import InvoiceSettingsClient from '@/components/admin/finance/invoice-settings-client'

export const metadata: Metadata = {
  title: 'تنظیمات فاکتور — مالی',
  description: 'مشخصات حقوقی، الگوی شماره، مالیات پیش‌فرض و ظاهر چاپ',
  robots: { index: false, follow: false, nocache: true },
}

export default function InvoiceSettingsPage() {
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
