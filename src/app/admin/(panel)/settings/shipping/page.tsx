import type { Metadata } from 'next'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import ShippingSettingsClient from '@/components/admin/shipping/shipping-settings-page'

export const metadata: Metadata = {
  title: 'تنظیمات حمل‌ونقل',
  description: 'مدیریت روش‌های ارسال، شرکت‌های حمل و قوانین قیمت‌گذاری',
  robots: { index: false, follow: false, nocache: true },
}

export default function ShippingSettingsPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader title="حمل‌ونقل و ارسال" description="روش‌ها، شرکت‌های حمل، مناطق پوشش و قوانین قیمت‌گذاری" />
      <ShippingSettingsClient />
    </div>
  )
}
