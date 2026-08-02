'use client'

import { ProductListRow } from '@/components/products/product-list-row'
import { ProductCard } from '@/components/ui/product-card'
import { ProductCardSkeleton } from '@/components/ui/skeleton'
import { useCompareHydrated, useWishlistHydrated } from '@/hooks/use-has-hydrated'
import { cn } from '@/lib/utils'
import { useCartStore } from '@/store/cart-store'
import { useCompareStore } from '@/store/compare-store'
import { useWishlistStore } from '@/store/wishlist-store'
import type { ProductCardData } from '@/types/product'

const COLS = {
  3: 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
} as const

export type CatalogViewMode = 'grid' | 'list'

export interface ProductGridProps {
  products: ProductCardData[]
  columns?: 3 | 4
  view?: CatalogViewMode
  isLoading?: boolean
  skeletonCount?: number
  empty?: React.ReactNode
  className?: string
  showWishlist?: boolean
  showCompare?: boolean
}

/**
 * گرید/لیست مشترک محصولات + اتصال store.
 *
 * دکمه‌های مقایسه/علاقه‌مندی/سبد همیشه رندر می‌شوند (نه وابسته به canAct)
 * تا بعد از hydration ناپدید/پدید نشوند. فقط وضعیت active بعد از
 * بازیابی persist درست می‌شود.
 */
export function ProductGrid({
  products,
  columns = 4,
  view = 'grid',
  isLoading = false,
  skeletonCount = 6,
  empty,
  className,
  showWishlist = true,
  showCompare = true,
}: ProductGridProps) {
  const compareReady = useCompareHydrated()
  const wishlistReady = useWishlistHydrated()
  const addItem = useCartStore((s) => s.addItem)
  const toggleCompare = useCompareStore((s) => s.toggle)
  const compareItems = useCompareStore((s) => s.items)
  const toggleWishlist = useWishlistStore((s) => s.toggle)
  const wishlistItems = useWishlistStore((s) => s.items)

  if (isLoading) {
    if (view === 'list') {
      return (
        <div className={cn('space-y-3', className)} aria-busy="true">
          {Array.from({ length: skeletonCount }).map((_, i) => (
            <div key={i} className="surface-3d h-28 animate-pulse rounded-2xl bg-surface-2" />
          ))}
        </div>
      )
    }
    return (
      <div className={cn('grid gap-6', COLS[columns], className)} aria-busy="true">
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (products.length === 0) {
    return empty ? <>{empty}</> : null
  }

  if (view === 'list') {
    return (
      <ul className={cn('space-y-3', className)}>
        {products.map((product) => {
          const inCompare = compareReady && compareItems.some((i) => i.id === product.id)
          const inWishlist = wishlistReady && wishlistItems.some((i) => i.id === product.id)
          return (
            <li key={product.id}>
              <ProductListRow
                product={product}
                inCompare={inCompare}
                inWishlist={inWishlist}
                onAddToCart={() => addItem(product)}
                onCompare={showCompare ? () => toggleCompare(product) : undefined}
                onWishlist={showWishlist ? () => toggleWishlist(product) : undefined}
              />
            </li>
          )
        })}
      </ul>
    )
  }

  return (
    <div className={cn('grid gap-6', COLS[columns], className)}>
      {products.map((product) => {
        const inCompare = compareReady && compareItems.some((i) => i.id === product.id)
        const inWishlist = wishlistReady && wishlistItems.some((i) => i.id === product.id)

        return (
          <ProductCard
            key={product.id}
            product={product}
            inCompare={inCompare}
            inWishlist={inWishlist}
            onAddToCart={() => addItem(product)}
            onCompare={showCompare ? () => toggleCompare(product) : undefined}
            onWishlist={showWishlist ? () => toggleWishlist(product) : undefined}
          />
        )
      })}
    </div>
  )
}
