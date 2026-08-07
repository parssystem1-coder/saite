import type { Metadata } from 'next'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import CustomersClient from '@/components/admin/customers/customers-client'

export const metadata: Metadata = {
  title: 'مشتریان — CRM',
  description: 'جستجو، سگمنت‌بندی، آدرس‌ها، رضایت‌نامه و تاریخچهٔ مشتریان',
  robots: { index: false, follow: false, nocache: true },
}

export default function CustomersPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader title="مشتریان" description="CRM عملیاتی — سگمنت، آدرس، رضایت و یادداشت داخلی" />
      <CustomersClient />
    </div>
  )
}
