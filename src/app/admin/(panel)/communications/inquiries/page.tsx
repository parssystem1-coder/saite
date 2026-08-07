import type { Metadata } from 'next'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import InquiriesClient from '@/components/admin/communications/inquiries-client'

export const metadata: Metadata = {
  title: 'درخواست‌های استعلام — ارتباطات',
  description: 'صندوق لیدهای فرم تماس و واتساپ با ارجاع و پیگیری',
  robots: { index: false, follow: false, nocache: true },
}

export default function InquiriesPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="درخواست‌های استعلام"
        description="لیدهای فرم تماس، واتساپ، تلفن و ایمیل — ارجاع، پیگیری و یادداشت داخلی"
      />
      <InquiriesClient />
    </div>
  )
}
