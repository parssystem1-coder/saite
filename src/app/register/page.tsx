import { Metadata } from 'next'
import { RegisterClient } from '@/components/auth/register-client'

export const metadata: Metadata = {
  title: 'ثبت‌نام در سامانه',
  description: 'به جمع کاربران هوشمند ما بپیوندید و از تخفیف‌های ویژه بهره‌مند شوید.',
}

export default function RegisterPage() {
  return <RegisterClient />
}
