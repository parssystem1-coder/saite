import type { Metadata } from 'next'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import SubscriptionsClient from '@/components/admin/finance/subscriptions-client'

export const metadata: Metadata = {
  title: 'اشتراک‌ها — مالی',
  description: 'قراردادهای دوره‌ای سرویس و پشتیبانی، MRR و تمدید',
  robots: { index: false, follow: false, nocache: true },
}

export default function SubscriptionsPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="اشتراک‌ها"
        description="قرارداد پشتیبانی، سرویس دوره‌ای و MRR — با توقف، تمدید و لغو"
      />
      <SubscriptionsClient />
    </div>
  )
}
