import type { Metadata } from 'next'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { AdminCategoriesClient } from '@/components/admin/admin-categories-client'

export const metadata: Metadata = {
  title: 'دسته‌بندی‌ها و برندها',
  description: 'مدیریت دسته‌بندی‌های کاتالوگ و برندها برای فرم افزودن محصول',
  robots: { index: false, follow: false },
}

export default function AdminCategoriesPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="دسته‌بندی و برند محصولات"
        description="مدیریت دسته‌بندی‌های کاتالوگ و برندها جهت استفاده در ویرایشگر افزودن محصول"
      />
      <AdminCategoriesClient />
    </div>
  )
}
