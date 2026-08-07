import { Skeleton } from '@/components/ui/skeleton'

export default function BrandsLoading() {
  return (
    <div className="container mx-auto px-4 py-10">
      <div className="mb-8 space-y-3">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-4 w-full max-w-xl" />
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="surface-3d rounded-2xl p-6 text-center">
            <Skeleton className="mx-auto size-16 rounded-xl" />
            <Skeleton className="mx-auto mt-3 h-4 w-20" />
          </div>
        ))}
      </div>
    </div>
  )
}
