import { Metadata } from 'next'
import { LoginClient } from '@/components/auth/login-client'

export const metadata: Metadata = {
  title: 'ورود به حساب کاربری',
  description: 'برای دسترسی به پنل هوشمند و پیگیری سفارشات خود وارد شوید.',
}

export default function LoginPage() {
  return <LoginClient />
}
