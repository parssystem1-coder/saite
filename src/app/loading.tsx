import { Skeleton } from '@/components/ui/skeleton'

/**
 * اسکلتون سراسری مسیر — هنگام ناوبری بین صفحات.
 * جایگزین صفحهٔ سفید و کاهش CLS.
 */
export default function RootLoading() {
  return (
    <div className="container mx-auto space-y-8 px-4 py-10" aria-busy="true" aria-live="polite">
      <span className="sr-only">در حال بارگذاری صفحه…</span>
      <Skeleton className="h-48 w-full rounded-3xl md:h-64" />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-72 rounded-2xl" />
        ))}
      </div>
    </div>
  )
}
