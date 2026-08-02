'use client'

import { useQuery } from '@tanstack/react-query'
import { Heart, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { ProductGrid } from '@/components/products/product-grid'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { SectionHeader } from '@/components/ui/section-header'
import { useHasHydrated } from '@/hooks/use-has-hydrated'
import { getProductsByIds } from '@/lib/api'
import { formatNumber } from '@/lib/format'
import { useWishlistStore } from '@/store/wishlist-store'

export function WishlistClient() {
  const hydrated = useHasHydrated()
  const items = useWishlistStore((s) => s.items)
  const clear = useWishlistStore((s) => s.clear)

  const ids = items.map((i) => i.id)

  const { data: products, isLoading } = useQuery({
    queryKey: ['wishlist', ids],
    queryFn: () => getProductsByIds(ids),
    enabled: hydrated && ids.length > 0,
  })

  const description =
    hydrated && items.length > 0
      ? `${formatNumber(items.length)} کالا ذخیره کرده‌اید`
      : 'کالاهایی که برای بررسی بعدی ذخیره کرده‌اید'

  return (
    <div className="container mx-auto px-4 py-10">
      <Breadcrumb
        className="mb-8"
        items={[{ label: 'خانه', href: '/' }, { label: 'علاقه‌مندی‌ها' }]}
      />

      <SectionHeader
        as="h1"
        title="علاقه‌مندی‌ها"
        description={description}
        action={
          hydrated && items.length > 0 ? (
            <Button variant="secondary" size="sm" onClick={clear}>
              <Trash2 />
              پاک کردن همه
            </Button>
          ) : undefined
        }
      />

      {!hydrated || (items.length > 0 && (isLoading || !products)) ? (
        <ProductGrid products={[]} columns={4} isLoading skeletonCount={items.length || 4} />
      ) : items.length === 0 ? (
        <div className="surface-3d rounded-2xl">
          <EmptyState
            icon={Heart}
            title="فهرست علاقه‌مندی‌ها خالی است"
            description="با زدن آیکون قلب روی هر کالا، آن را برای بررسی بعدی اینجا ذخیره کنید."
            action={
              <Button asChild>
                <Link href="/products">مشاهدهٔ محصولات</Link>
              </Button>
            }
          />
        </div>
      ) : (
        <ProductGrid products={products ?? []} columns={4} />
      )}
    </div>
  )
}
