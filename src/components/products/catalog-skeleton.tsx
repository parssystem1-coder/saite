import { ProductCardSkeleton, Skeleton } from '@/components/ui/skeleton'

/**
 * اسکلتون بدنهٔ کاتالوگ (بدون عنوان صفحه).
 *
 * عنوان در Server Page رندر می‌شود و ثابت است، پس اینجا تکرار
 * نمی‌شود — وگرنه هنگام بارگذاری دو عنوان روی هم می‌افتاد.
 */
export function CatalogSkeleton() {
  return (
    <div className="flex flex-col gap-8 lg:flex-row" aria-busy="true" aria-live="polite">
      <span className="sr-only">در حال بارگذاری کاتالوگ…</span>

      <aside className="hidden w-72 shrink-0 lg:block">
        <Skeleton className="h-[28rem] w-full rounded-2xl" />
      </aside>

      <div className="min-w-0 flex-1">
        <div className="mb-6 flex justify-between gap-3">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  )
}
