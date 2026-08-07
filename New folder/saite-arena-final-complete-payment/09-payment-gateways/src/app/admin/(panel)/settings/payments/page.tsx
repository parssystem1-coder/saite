import type { Metadata } from 'next'
import { PaymentSettingsPage } from '@/components/admin/payments/payment-settings-page'
export const metadata:Metadata={title:'درگاه‌های پرداخت',description:'مدیریت درگاه‌های پرداخت آنلاین و تنظیمات تراکنش'}
export const dynamic='force-dynamic'
export default function Page(){return <PaymentSettingsPage/>}
