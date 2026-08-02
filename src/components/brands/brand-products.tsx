'use client'

import { ProductGrid } from '@/components/products/product-grid'
import type { Product } from '@/types/product'

/** پل کلاینت برای گرید محصولات صفحهٔ برند (Server → Client) */
export function BrandProducts({ products }: { products: Product[] }) {
  return <ProductGrid products={products} columns={4} />
}
