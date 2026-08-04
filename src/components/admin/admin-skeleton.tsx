import { Skeleton } from '@/components/ui/skeleton'

/**
 * اسکلتون پنل مدیریت — هم‌ابعاد چیدمان AdminShell.
 *
 * هم برای `loading.tsx` سگمنت ادمین استفاده می‌شود و هم توسط
 * AdminGuard تا هنگام بازیابی وضعیت ورود، صفحه نپرد.
 */
export function AdminSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      <span className="sr-only">در حال بارگذاری پنل مدیریت…</span>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-9 w-32 rounded-lg" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-2xl" />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        <Skeleton className="h-80 rounded-2xl xl:col-span-3" />
        <Skeleton className="h-80 rounded-2xl xl:col-span-2" />
      </div>
    </div>
  )
}
