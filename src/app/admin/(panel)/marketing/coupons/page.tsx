import type { Metadata } from 'next'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import CouponsClient from '@/components/admin/marketing/coupons-client'

export const metadata: Metadata = {
  title: 'کد تخفیف — بازاریابی',
  description: 'ساخت و مدیریت کوپن‌های درصدی و مبلغی با محدودیت استفاده',
  robots: { index: false, follow: false, nocache: true },
}

export default function CouponsPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="کد تخفیف"
        description="ساخت، فعال/غیرفعال کردن و حذف کوپن — با محاسبهٔ خودکار وضعیت انقضا و سقف"
      />
      <CouponsClient />
    </div>
  )
}
