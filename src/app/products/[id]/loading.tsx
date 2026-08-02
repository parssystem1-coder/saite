import { Skeleton } from '@/components/ui/skeleton'

/** اسکلتون صفحهٔ جزئیات محصول */
export default function ProductDetailLoading() {
  return (
    <div className="container mx-auto px-4 py-10" aria-busy="true" aria-live="polite">
      <span className="sr-only">در حال بارگذاری محصول…</span>
      <Skeleton className="mb-8 h-5 w-64" />
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
        <Skeleton className="aspect-square w-full rounded-2xl" />
        <div className="space-y-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full max-w-md" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-48 w-full rounded-2xl" />
        </div>
      </div>
      <Skeleton className="mt-16 h-12 w-full max-w-lg" />
      <Skeleton className="mt-8 h-64 w-full rounded-2xl" />
    </div>
  )
}
