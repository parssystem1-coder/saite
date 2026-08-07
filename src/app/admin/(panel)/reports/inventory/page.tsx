import type { Metadata } from 'next'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import InventoryReportClient from '@/components/admin/reports/inventory-report-client'

export const metadata: Metadata = {
  title: 'گزارش موجودی و مصرفی',
  description: 'وضعیت انبار، نقطهٔ سفارش و فروش مواد مصرفی',
  robots: { index: false, follow: false, nocache: true },
}

export default function InventoryReportPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="موجودی و مصرفی"
        description="وضعیت انبار، نقطهٔ سفارش و پرفروش‌ترین تونر/قطعه — با هشدار ناموجودی"
      />
      <InventoryReportClient />
    </div>
  )
}
