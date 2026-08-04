import { AdminSkeleton } from '@/components/admin/admin-skeleton'

export default function AdminLoading() {
  return (
    <div className="container mx-auto px-4 py-8 md:py-10">
      <AdminSkeleton />
    </div>
  )
}
