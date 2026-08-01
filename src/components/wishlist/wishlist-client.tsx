'use client'

import { useQuery } from '@tanstack/react-query'
import { Heart, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { ProductCard } from '@/components/ui/product-card'
import { ProductCardSkeleton } from '@/components/ui/skeleton'
import { useHasHydrated } from '@/hooks/use-has-hydrated'
import { getProductsByIds } from '@/lib/api'
import { formatNumber } from '@/lib/format'
import { useCartStore } from '@/store/cart-store'
import { useCompareStore } from '@/store/compare-store'
import { useWishlistStore } from '@/store/wishlist-store'

export function WishlistClient() {
  const hydrated = useHasHydrated()
  const items = useWishlistStore((s) => s.items)
  const clear = useWishlistStore((s) => s.clear)
  const toggleWishlist = useWishlistStore((s) => s.toggle)
  const addItem = useCartStore((s) => s.addItem)
  const toggleCompare = useCompareStore((s) => s.toggle)

  const ids = items.map((i) => i.id)

  const { data: products } = useQuery({
    queryKey: ['wishlist', ids],
    queryFn: () => getProductsByIds(ids),
    enabled: hydrated && ids.length > 0,
  })

  return (
    <div className="container mx-auto px-4 py-10">
      <Breadcrumb
        className="mb-8"
        items={[{ label: 'خانه', href: '/' }, { label: 'علاقه‌مندی‌ها' }]}
      />

      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-foreground md:text-3xl">علاقه‌مندی‌ها</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {hydrated && items.length > 0
              ? `${formatNumber(items.length)} کالا ذخیره کرده‌اید`
              : 'کالاهایی که برای بررسی بعدی ذخیره کرده‌اید'}
          </p>
        </div>
        {hydrated && items.length > 0 && (
          <Button variant="secondary" size="sm" onClick={clear}>
            <Trash2 />
            پاک کردن همه
          </Button>
        )}
      </header>

      {!hydrated ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
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
      ) : !products ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((i) => (
            <ProductCardSkeleton key={i.id} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              onAddToCart={() => addItem(p)}
              onCompare={() => toggleCompare(p)}
              onWishlist={() => toggleWishlist(p)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
