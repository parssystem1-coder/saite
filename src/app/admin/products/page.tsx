import type { Metadata } from 'next'
import { AdminProductsPanel } from '@/components/admin/admin-products-panel'

export const metadata: Metadata = {
  title: 'محصولات',
  description: 'مدیریت کاتالوگ و موجودی',
  robots: { index: false, follow: false },
}

export default function Page() {
  return <AdminProductsPanel />
}
