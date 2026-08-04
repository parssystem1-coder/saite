import type { Metadata } from 'next'
import { ForgotPasswordClient } from '@/components/auth/forgot-password-client'

export const metadata: Metadata = {
  title: 'بازیابی رمز عبور',
  description: 'بازیابی رمز عبور حساب کاربری فروشگاه.',
  // صفحات احراز هویت نباید ایندکس شوند
  robots: { index: false, follow: true },
}

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
      <ForgotPasswordClient />
    </div>
  )
}
