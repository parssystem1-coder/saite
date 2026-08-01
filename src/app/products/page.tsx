import type { Metadata } from 'next'
import { Suspense } from 'react'
import { ProductsClient } from '@/components/products/products-client'
import { ProductCardSkeleton } from '@/components/ui/skeleton'

export const metadata: Metadata = {
  title: 'کاتالوگ محصولات',
  description:
    'پرینتر، اسکنر، دستگاه کپی، فکس، مواد مصرفی و قطعات یدکی؛ فیلتر بر اساس برند، فناوری چاپ و ردهٔ کاربری.',
}

/** اسکلتون هم‌ابعاد صفحه تا هنگام بارگذاری، چیدمان نپرد */
function CatalogSkeleton() {
  return (
    <div className="container mx-auto px-4 py-10">
      <div className="flex flex-col gap-8 lg:flex-row">
        <div className="hidden w-72 shrink-0 lg:block">
          <div className="surface-3d h-[32rem] rounded-2xl" />
        </div>
        <div className="grid min-w-0 flex-1 grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  )
}

export default function ProductsPage() {
  // useSearchParams نیازمند مرز Suspense است تا صفحه بتواند
  // به‌صورت استاتیک پیش‌رندر شود.
  return (
    <Suspense fallback={<CatalogSkeleton />}>
      <ProductsClient />
    </Suspense>
  )
}
