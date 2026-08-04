import { ArrowRight } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { AdminProductForm } from '@/components/admin/admin-product-form'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'افزودن محصول',
  description: 'ثبت کالای جدید در کاتالوگ',
  robots: { index: false, follow: false },
}

/** Server Page + Client island — فرم تنها بخش تعاملی است */
export default function NewProductPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="افزودن محصول جدید"
        description="ثبت کالا در کاتالوگ (ذخیره پس از اتصال بک‌اند فعال می‌شود)"
        actions={
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/products">
              <ArrowRight className="size-4" />
              بازگشت
            </Link>
          </Button>
        }
      />

      <AdminProductForm />
    </div>
  )
}
