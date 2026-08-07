import type { Metadata } from 'next'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import PaymentSettingsClient from '@/components/admin/payments/payment-settings-page'

export const metadata: Metadata = {
  title: 'تنظیمات درگاه‌های پرداخت',
  description: 'مدیریت درگاه‌های پرداخت آنلاین و تنظیمات تراکنش',
  robots: { index: false, follow: false, nocache: true },
}

export default function PaymentSettingsPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader title="درگاه‌های پرداخت" description="اتصال امن، اولویت‌بندی و کنترل سلامت درگاه‌های آنلاین" />
      <PaymentSettingsClient />
    </div>
  )
}
