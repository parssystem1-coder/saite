'use client'

import { ProductGrid } from '@/components/products/product-grid'
import type { ProductCardData } from '@/types/product'

/**
 * پل کلاینت برای گرید محصولات صفحهٔ برند (Server → Client).
 *
 * ورودی عمداً ProductCardData است نه Product: صفحهٔ برند تا ۱۳ کالا
 * دارد و ارسال specs/reviews/faqs همهٔ آن‌ها payload را بی‌دلیل
 * سنگین می‌کرد.
 */
export function BrandProducts({ products }: { products: ProductCardData[] }) {
  return <ProductGrid products={products} columns={4} />
}
