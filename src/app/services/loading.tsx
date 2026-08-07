import { Skeleton } from '@/components/ui/skeleton'

export default function ServicesLoading() {
  return (
    <div className="container mx-auto px-4 py-10">
      <div className="mb-8 space-y-3">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-4 w-full max-w-2xl" />
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="surface-3d rounded-2xl p-6">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="mt-3 h-4 w-full" />
            <Skeleton className="mt-2 h-4 w-5/6" />
            <Skeleton className="mt-6 h-10 w-full rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  )
}
