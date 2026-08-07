import type { Metadata } from 'next'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import PageNewClient from '@/components/admin/content/page-new-client'

export const metadata: Metadata = {
  title: 'افزودن صفحهٔ جدید',
  description: 'ساخت صفحهٔ سفارشی جدید با slug و SEO',
  robots: { index: false, follow: false, nocache: true },
}

export default function NewPagePage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="افزودن صفحهٔ جدید"
        description="عنوان، slug، توضیح و جای‌گیری در فوتر/هدر — با اعتبارسنجی slug"
      />
      <PageNewClient />
    </div>
  )
}
