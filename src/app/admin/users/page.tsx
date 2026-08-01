import { Users } from 'lucide-react'
import type { Metadata } from 'next'
import { AdminPlaceholder } from '@/components/admin/admin-placeholder'

export const metadata: Metadata = {
  title: 'مدیریت مشتریان',
  robots: { index: false, follow: false },
}

export default function Page() {
  return (
    <AdminPlaceholder
      title="مدیریت مشتریان"
      description="مشاهده و مدیریت حساب‌های کاربری و مشتریان سازمانی"
      icon={Users}
      planned={['فهرست کاربران و تاریخچهٔ خرید', 'تفکیک مشتری خرد و سازمانی', 'مدیریت سطح دسترسی']}
    />
  )
}
