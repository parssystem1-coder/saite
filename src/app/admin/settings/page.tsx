import { Settings } from 'lucide-react'
import type { Metadata } from 'next'
import { AdminPlaceholder } from '@/components/admin/admin-placeholder'

export const metadata: Metadata = {
  title: 'تنظیمات سیستم',
  robots: { index: false, follow: false },
}

export default function Page() {
  return (
    <AdminPlaceholder
      title="تنظیمات سیستم"
      description="پیکربندی فروشگاه، ارسال و درگاه پرداخت"
      icon={Settings}
      planned={[
        'اطلاعات تماس و ساعات کاری',
        'نوار شناور تماس (واتساپ / اینستاگرام / تلفن)',
        'نرخ و روش‌های ارسال',
        'اتصال درگاه پرداخت',
      ]}
    />
  )
}
