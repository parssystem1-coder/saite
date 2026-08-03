import { ProductCardSkeleton, Skeleton } from '@/components/ui/skeleton'

/** اسکلتون علاقه‌مندی‌ها — هم‌تراز گرید ۴ ستونه */
export default function WishlistLoading() {
  return (
    <div className="container mx-auto px-4 py-10" aria-busy="true" aria-live="polite">
      <span className="sr-only">در حال بارگذاری علاقه‌مندی‌ها…</span>
      <Skeleton className="mb-8 h-5 w-48" />
      <div className="mb-8 space-y-2">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}
