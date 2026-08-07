import type { Metadata } from 'next'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import OrdersClient from '@/components/admin/orders/orders-client'

export const metadata: Metadata = {
  title: 'سفارش‌ها — عملیات ارسال',
  description: 'از تایید سفارش تا چاپ برچسب و تحویل به شرکت ارسال — مدیریت چندبسته‌ای و مرجوعی',
  robots: { index: false, follow: false, nocache: true },
}

export default function OrdersPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader title="سفارش‌ها" description="از تایید سفارش تا چاپ برچسب و تحویل به شرکت ارسال — چندبسته‌ای و مرجوعی" />
      <OrdersClient />
    </div>
  )
}
