import { ProductCardSkeleton } from '@/components/ui/skeleton'
import { Skeleton } from '@/components/ui/skeleton'

/** اسکلتون کاتالوگ — هم‌تراز چیدمان فیلتر + گرید */
export default function ProductsLoading() {
  return (
    <div className="container mx-auto px-4 py-10" aria-busy="true" aria-live="polite">
      <span className="sr-only">در حال بارگذاری کاتالوگ…</span>
      <Skeleton className="mb-8 h-10 w-64" />
      <Skeleton className="mb-8 h-4 w-full max-w-xl" />

      <div className="flex flex-col gap-8 lg:flex-row">
        <aside className="hidden w-72 shrink-0 lg:block">
          <Skeleton className="h-[28rem] w-full rounded-2xl" />
        </aside>
        <main className="min-w-0 flex-1">
          <div className="mb-6 flex justify-between gap-3">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-40" />
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        </main>
      </div>
    </div>
  )
}
