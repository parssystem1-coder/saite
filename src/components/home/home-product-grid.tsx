'use client'

import { ProductGrid } from '@/components/products/product-grid'
import type { ProductCardData } from '@/types/product'

/**
 * پل نازک صفحهٔ اصلی → ProductGrid مشترک.
 * نگه‌داشته شده برای importهای موجود؛ منطق واقعی در ProductGrid است.
 */
export function HomeProductGrid({ products }: { products: ProductCardData[] }) {
  return <ProductGrid products={products} columns={4} />
}
