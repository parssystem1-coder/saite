import type { Metadata } from 'next'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import ArticlesClient from '@/components/admin/content/articles-client'

export const metadata: Metadata = {
  title: 'مقالات — محتوا',
  description: 'مدیریت مجله و مقالات آموزشی',
  robots: { index: false, follow: false, nocache: true },
}

export default function ArticlesPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="مقالات"
        description="لیست، افزودن پیش‌نویس، انتشار/بازگردانی و حذف — با اعتبارسنجی slug"
      />
      <ArticlesClient />
    </div>
  )
}
