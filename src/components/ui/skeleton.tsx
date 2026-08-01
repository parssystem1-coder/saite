import { cn } from '@/lib/utils'

/**
 * اسکلتون بارگذاری.
 * جایگزین اسپینر و الگوی «return null» است — هر دو باعث پرش محتوا
 * (CLS) می‌شوند، در حالی که اسکلتون فضای نهایی را از پیش رزرو می‌کند.
 */
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-lg bg-surface-2', className)}
      aria-hidden="true"
      {...props}
    />
  )
}

/** اسکلتون هم‌ابعاد با ProductCard تا شبکه هنگام بارگذاری نپرد */
export function ProductCardSkeleton() {
  return (
    <div className="surface-3d h-full rounded-2xl p-4">
      <Skeleton className="aspect-4/3 w-full rounded-xl" />
      <Skeleton className="mt-3 h-2.5 w-16" />
      <Skeleton className="mt-2 h-4 w-32" />
      <Skeleton className="mt-2 h-3 w-full" />
      <Skeleton className="mt-1.5 h-3 w-3/4" />
      <div className="mt-3 flex gap-1.5">
        <Skeleton className="h-4 w-16 rounded-md" />
        <Skeleton className="h-4 w-14 rounded-md" />
      </div>
      <div className="mt-4 border-t border-border pt-3">
        <Skeleton className="h-6 w-28" />
        <div className="mt-3 flex gap-2">
          <Skeleton className="h-9 flex-1 rounded-lg" />
          <Skeleton className="size-9 rounded-lg" />
          <Skeleton className="size-9 rounded-lg" />
        </div>
      </div>
    </div>
  )
}
