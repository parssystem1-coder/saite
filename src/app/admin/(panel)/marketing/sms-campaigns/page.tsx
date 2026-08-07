import type { Metadata } from 'next'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import SmsCampaignsClient from '@/components/admin/marketing/sms-campaigns-client'

export const metadata: Metadata = {
  title: 'کمپین پیامکی — بازاریابی',
  description: 'کمپین‌های انبوه پیامکی با انتخاب مخاطب و گزارش تحویل',
  robots: { index: false, follow: false, nocache: true },
}

export default function SmsCampaignsPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="کمپین پیامکی"
        description="ساخت پیش‌نویس، انتخاب سگمنت مخاطب و ارسال — با گزارش تحویل و خطا"
      />
      <SmsCampaignsClient />
    </div>
  )
}
