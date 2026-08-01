'use client'

import { ProductCard } from '@/components/ui/product-card'
import { useCartStore } from '@/store/cart-store'
import type { Product } from '@/types/product'

/**
 * پل میان صفحهٔ سرور و کارت‌های تعاملی.
 *
 * صفحهٔ اصلی یک Server Component است (برای SEO و حذف JS اضافی)، اما
 * افزودن به سبد نیاز به کلاینت دارد. این لایهٔ نازک فقط همان مرز را
 * مدیریت می‌کند.
 */
export function HomeProductGrid({ products }: { products: Product[] }) {
  const addItem = useCartStore((s) => s.addItem)

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onAddToCart={() => addItem(product)}
        />
      ))}
    </div>
  )
}
