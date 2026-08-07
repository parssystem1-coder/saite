import type { Metadata } from 'next'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import PagesClient from '@/components/admin/content/pages-client'

export const metadata: Metadata = {
  title: 'همهٔ صفحات',
  description: 'صفحات سفارشی لینک‌پذیر سایت',
  robots: { index: false, follow: false, nocache: true },
}

export default function PagesListPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="صفحات سایت"
        description="مدیریت صفحات سفارشی — انتشار، نمایش در فوتر/هدر و حذف"
      />
      <PagesClient />
    </div>
  )
}
