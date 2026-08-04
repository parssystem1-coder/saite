import type { Metadata } from 'next'
import { AdminDashboard } from '@/components/admin/admin-dashboard'

export const metadata: Metadata = {
  title: 'داشبورد مدیریت',
  description: 'نمای کلی فروشگاه، آمار و آخرین فعالیت‌ها',
  robots: { index: false, follow: false },
}

export default function AdminDashboardPage() {
  return <AdminDashboard />
}
