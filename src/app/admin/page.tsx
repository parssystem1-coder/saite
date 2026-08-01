import { Metadata } from 'next'
import { AdminClient } from '@/components/admin/admin-client'

export const metadata: Metadata = {
  title: 'پنل مدیریت سیستمی',
  description: 'مدیریت کلان فروشگاه، آمار فروش و کنترل موجودی انبار.',
}

export default function AdminDashboardPage() {
  return <AdminClient />
}
