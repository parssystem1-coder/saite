import type { Metadata } from 'next'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import InvoicesClient from '@/components/admin/finance/invoices-client'

export const metadata: Metadata = {
  title: 'صورت‌حساب‌ها — مالی',
  description: 'صدور و پیگیری صورت‌حساب مشتریان با فیلتر وضعیت، جستجو و علامت‌گذاری پرداخت',
  robots: { index: false, follow: false, nocache: true },
}

export default function InvoicesPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="صورت‌حساب‌ها"
        description="لیست، فیلتر، جستجو و مدیریت وضعیت پرداخت — با محاسبهٔ سازگار مالیات و تخفیف در یک منبع حقیقت"
      />
      <InvoicesClient />
    </div>
  )
}
