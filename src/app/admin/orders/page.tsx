import { ShoppingCart } from 'lucide-react'
import type { Metadata } from 'next'
import { AdminPlaceholder } from '@/components/admin/admin-placeholder'

export const metadata: Metadata = {
  title: 'مدیریت سفارش‌ها',
  robots: { index: false, follow: false },
}

export default function Page() {
  return (
    <AdminPlaceholder
      title="مدیریت سفارش‌ها"
      description="پیگیری، تغییر وضعیت و صدور فاکتور سفارش‌ها"
      icon={ShoppingCart}
      planned={['فهرست سفارش‌ها با فیلتر وضعیت', 'تغییر وضعیت و ثبت کد رهگیری مرسوله', 'صدور فاکتور رسمی']}
    />
  )
}
