import { Skeleton } from '@/components/ui/skeleton'

/** اسکلتون مقایسه — جدول عریض با ستون‌های محصول */
export default function CompareLoading() {
  return (
    <div className="container mx-auto px-4 py-10" aria-busy="true" aria-live="polite">
      <span className="sr-only">در حال بارگذاری جدول مقایسه…</span>
      <Skeleton className="mb-6 h-5 w-40" />
      <div className="mb-8 space-y-2">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      <Skeleton className="h-[32rem] w-full rounded-2xl" />
    </div>
  )
}
