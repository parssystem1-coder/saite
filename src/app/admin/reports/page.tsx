import { BarChart3 } from 'lucide-react'
import type { Metadata } from 'next'
import { AdminPlaceholder } from '@/components/admin/admin-placeholder'

export const metadata: Metadata = {
  title: 'گزارش‌های مالی',
  robots: { index: false, follow: false },
}

export default function Page() {
  return (
    <AdminPlaceholder
      title="گزارش‌های مالی"
      description="تحلیل فروش، سودآوری و عملکرد دسته‌بندی‌ها"
      icon={BarChart3}
      planned={['نمودار فروش دوره‌ای', 'پرفروش‌ترین کالاها و دسته‌ها', 'خروجی اکسل گزارش‌ها']}
    />
  )
}
