'use client'

import { ProductCard } from '@/components/ui/product-card'
import { ProductCardSkeleton } from '@/components/ui/skeleton'
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
  /** اگر products خالی است و loading نیست، این را نشان بده */
  empty?: React.ReactNode
  className?: string
  /**
   * اگر false باشد، دکمه‌های wishlist روی کارت مخفی نمی‌شوند —
   * فقط callback وصل نمی‌شود. پیش‌فرض: همهٔ کنش‌ها فعال.
   */
  showWishlist?: boolean
}

/**
 * گرید مشترک محصولات + اتصال store.
 *
 * مرز دامنه اینجاست: ui/ProductCard فقط props می‌گیرد؛
 * افزودن به سبد/مقایسه/علاقه‌مندی در این لایه انجام می‌شود.
 */
export function ProductGrid({
  products,
  columns = 4,
  isLoading = false,
  skeletonCount = 6,
  empty,
  className,
  showWishlist = true,
}: ProductGridProps) {
  const addItem = useCartStore((s) => s.addItem)
  const toggleCompare = useCompareStore((s) => s.toggle)
  const toggleWishlist = useWishlistStore((s) => s.toggle)

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
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onAddToCart={() => addItem(product)}
          onCompare={() => toggleCompare(product)}
          onWishlist={showWishlist ? () => toggleWishlist(product) : undefined}
        />
      ))}
    </div>
  )
}
