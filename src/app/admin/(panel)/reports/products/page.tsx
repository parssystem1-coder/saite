import type { Metadata } from 'next'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import ProductsReportClient from '@/components/admin/reports/products-report-client'

export const metadata: Metadata = {
  title: 'گزارش محصولات',
  description: 'رتبه‌بندی پرفروش‌ها، تحلیل دسته و هشدار کالای راکد',
  robots: { index: false, follow: false, nocache: true },
}

export default function ProductsReportPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="گزارش محصولات"
        description="پرفروش‌ها، تحلیل دسته و برند، حاشیهٔ سود و هشدار کالای راکد"
      />
      <ProductsReportClient />
    </div>
  )
}
