import type { Metadata } from 'next'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import SalesReportClient from '@/components/admin/reports/sales-report-client'

export const metadata: Metadata = {
  title: 'گزارش فروش',
  description: 'تحلیل فروش دوره‌ای و کانال‌ها با نمودار و جدول تفصیلی',
  robots: { index: false, follow: false, nocache: true },
}

export default function SalesReportPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="گزارش فروش"
        description="روند ماهانه، خالص و میانگین سبد — با انتخاب بازهٔ ۳/۶/۱۲ ماه"
      />
      <SalesReportClient />
    </div>
  )
}
