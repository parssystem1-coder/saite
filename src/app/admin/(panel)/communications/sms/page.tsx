import type { Metadata } from 'next'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import SmsClient from '@/components/admin/communications/sms-client'

export const metadata: Metadata = {
  title: 'پیامک‌ها — ارتباطات',
  description: 'صندوق پیامک‌های سیستمی، الگوها و گزارش تحویل',
  robots: { index: false, follow: false, nocache: true },
}

export default function SmsPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="پیامک‌ها"
        description="لاگ ارسال‌ها و مدیریت قالب‌های پیامکی — با استخراج خودکار متغیرها"
      />
      <SmsClient />
    </div>
  )
}
