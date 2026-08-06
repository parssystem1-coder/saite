import type { Metadata } from 'next'
import ProductEditor from '@/components/admin/products/ProductEditor'

export const metadata: Metadata = {
  title: 'افزودن محصول',
  description: 'ثبت کالای جدید در کاتالوگ',
  robots: { index: false, follow: false },
}

/** صفحهٔ مدیریت محصول — ویرایشگر ماژولار و حرفه‌ای محصولات */
export default function NewProductPage() {
  return <ProductEditor />
}
