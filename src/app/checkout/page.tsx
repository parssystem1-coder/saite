import type { Metadata } from 'next'
import { CheckoutClient } from '@/components/checkout/checkout-client'

export const metadata: Metadata = {
  title: 'تسویه‌حساب',
  description: 'تکمیل اطلاعات ارسال و پرداخت سفارش.',
  robots: { index: false, follow: false },
}

export default function CheckoutPage() {
  return <CheckoutClient />
}
