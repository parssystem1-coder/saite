import { Metadata } from 'next'
import { DashboardClient } from '@/components/dashboard/dashboard-client'

export const metadata: Metadata = {
  title: 'پنل کاربری هوشمند',
  description: 'مدیریت سفارشات، لیست علاقه‌مندی‌ها و تنظیمات حساب کاربری.',
}

export default function DashboardPage() {
  return <DashboardClient />
}
