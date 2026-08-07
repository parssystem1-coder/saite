import type { Metadata } from 'next'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import ArticleCategoriesClient from '@/components/admin/content/article-categories-client'

export const metadata: Metadata = {
  title: 'دسته‌بندی مقالات — محتوا',
  description: 'دسته‌های مجلهٔ آموزشی با ترتیب و اعتبارسنجی slug',
  robots: { index: false, follow: false, nocache: true },
}

export default function ArticleCategoriesPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="دسته‌بندی مقالات"
        description="افزودن، ترتیب و حذف — با اعتبارسنجی slug و تعداد مقاله"
      />
      <ArticleCategoriesClient />
    </div>
  )
}
