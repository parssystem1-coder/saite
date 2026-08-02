import { Skeleton } from '@/components/ui/skeleton'

/** اسکلتون سبد — جایگزین return null که باعث پرش صفحه می‌شد */
export function CartSkeleton() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex flex-col gap-12 lg:flex-row">
        <div className="flex-1 space-y-6">
          <Skeleton className="h-9 w-48" />
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-2xl" />
          ))}
        </div>
        <aside className="w-full lg:w-96">
          <Skeleton className="h-72 w-full rounded-2xl" />
        </aside>
      </div>
    </div>
  )
}
