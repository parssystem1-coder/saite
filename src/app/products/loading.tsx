import { CatalogSkeleton } from '@/components/products/catalog-skeleton'
import { Skeleton } from '@/components/ui/skeleton'

/** اسکلتون کاتالوگ — هم‌تراز چیدمان عنوان + فیلتر + گرید */
export default function ProductsLoading() {
  return (
    <div className="container mx-auto px-4 py-10">
      <div className="mb-8 space-y-2">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-4 w-full max-w-xl" />
      </div>
      <CatalogSkeleton />
    </div>
  )
}
