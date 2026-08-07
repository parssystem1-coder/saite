import type { Metadata } from 'next'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import CustomersReportClient from '@/components/admin/reports/customers-report-client'

export const metadata: Metadata = {
  title: 'گزارش مشتریان',
  description: 'رفتار خرید خرد و سازمانی، LTV و ریسک ریزش',
  robots: { index: false, follow: false, nocache: true },
}

export default function CustomersReportPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="گزارش مشتریان"
        description="مشتریان برتر بر اساس LTV، سگمنت‌بندی و نرخ بازگشت"
      />
      <CustomersReportClient />
    </div>
  )
}
