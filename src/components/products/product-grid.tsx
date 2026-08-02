'use client'

import { ProductCard } from '@/components/ui/product-card'
import { ProductCardSkeleton } from '@/components/ui/skeleton'
import { useHasHydrated } from '@/hooks/use-has-hydrated'
import { cn } from '@/lib/utils'
import { useCartStore } from '@/store/cart-store'
import { useCompareStore } from '@/store/compare-store'
import { useWishlistStore } from '@/store/wishlist-store'
import type { ProductCardData } from '@/types/product'

const COLS = {
  3: 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
} as const

export interface ProductGridProps {
  products: ProductCardData[]
  columns?: 3 | 4
  isLoading?: boolean
  skeletonCount?: number
  empty?: React.ReactNode
  className?: string
  showWishlist?: boolean
  showCompare?: boolean
}

/**
 * گرید مشترک محصولات + اتصال store.
 *
 * مرز دامنه اینجاست: ui/ProductCard فقط props می‌گیرد (pure)؛
 * وضعیت و callbackهای سبد/مقایسه/علاقه‌مندی اینجا تزریق می‌شود.
 */
export function ProductGrid({
  products,
  columns = 4,
  isLoading = false,
  skeletonCount = 6,
  empty,
  className,
  showWishlist = true,
  showCompare = true,
}: ProductGridProps) {
  const hydrated = useHasHydrated()
  const addItem = useCartStore((s) => s.addItem)
  const toggleCompare = useCompareStore((s) => s.toggle)
  const compareItems = useCompareStore((s) => s.items)
  const toggleWishlist = useWishlistStore((s) => s.toggle)
  const wishlistItems = useWishlistStore((s) => s.items)

  if (isLoading) {
    return (
      <div className={cn('grid gap-6', COLS[columns], className)}>
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (products.length === 0) {
    return empty ? <>{empty}</> : null
  }

  return (
    <div className={cn('grid gap-6', COLS[columns], className)}>
      {products.map((product) => {
        const inCompare = hydrated && compareItems.some((i) => i.id === product.id)
        const inWishlist = hydrated && wishlistItems.some((i) => i.id === product.id)

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
