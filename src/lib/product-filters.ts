import type { SortOption } from '@/lib/constants'
import type { CategorySlug, Product } from '@/types/product'

/**
 * منطق خالص فیلتر و مرتب‌سازی محصولات.
 *
 * عمداً از React جدا نگه داشته شده تا:
 *  ۱) بدون رندر کامپوننت قابل تست باشد
 *  ۲) بعداً بتوان همین قواعد را در Server Action یا کوئری دیتابیس بازاستفاده کرد
 */

export interface ProductFilters {
  q?: string
  category?: CategorySlug | 'all'
  subCategory?: string | 'all'
  brand?: string | 'all'
  technology?: string | 'all'
  usage?: string | 'all'
  color?: string | 'all'
  inStock?: boolean
  minPrice?: number
  maxPrice?: number
  sort?: SortOption
}

/** کالای استعلامی قیمت ندارد؛ در مرتب‌سازی قیمتی باید انتهای فهرست بیاید */
const priceForSort = (p: Product, whenMissing: number) => p.price ?? whenMissing

export function filterProducts(products: Product[], f: ProductFilters): Product[] {
  const q = f.q?.trim().toLowerCase()

  return products.filter((p) => {
    if (q) {
      const haystack = `${p.name} ${p.model} ${p.sku} ${p.brand}`.toLowerCase()
      if (!haystack.includes(q)) return false
    }
    if (f.category && f.category !== 'all' && p.category !== f.category) return false
    if (f.subCategory && f.subCategory !== 'all' && p.subCategory !== f.subCategory) return false
    if (f.brand && f.brand !== 'all' && p.brand !== f.brand) return false
    if (f.technology && f.technology !== 'all' && p.technology !== f.technology) return false
    if (f.usage && f.usage !== 'all' && p.usageClass !== f.usage) return false
    if (f.color && f.color !== 'all' && p.colorSupport !== f.color) return false
    if (f.inStock && p.stockStatus === 'out_of_stock') return false
    if (f.minPrice !== undefined && (p.price ?? 0) < f.minPrice) return false
    if (f.maxPrice !== undefined && p.price !== undefined && p.price > f.maxPrice) return false
    return true
  })
}

export function sortProducts(products: Product[], sort: SortOption = 'newest'): Product[] {
  const out = [...products]

  switch (sort) {
    case 'price_asc':
      return out.sort(
        (a, b) => priceForSort(a, Number.MAX_SAFE_INTEGER) - priceForSort(b, Number.MAX_SAFE_INTEGER)
      )
    case 'price_desc':
      return out.sort((a, b) => priceForSort(b, -1) - priceForSort(a, -1))
    case 'best_selling':
      return out.sort(
        (a, b) => Number(b.isBestSeller ?? false) - Number(a.isBestSeller ?? false)
      )
    default:
      return out.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }
}

export function applyFilters(products: Product[], f: ProductFilters): Product[] {
  return sortProducts(filterProducts(products, f), f.sort)
}

/** تعداد فیلترهای فعال — برای نمایش نشانگر روی دکمهٔ فیلتر در موبایل */
export function countActiveFilters(f: ProductFilters): number {
  let n = 0
  if (f.q?.trim()) n++
  if (f.category && f.category !== 'all') n++
  if (f.subCategory && f.subCategory !== 'all') n++
  if (f.brand && f.brand !== 'all') n++
  if (f.technology && f.technology !== 'all') n++
  if (f.usage && f.usage !== 'all') n++
  if (f.color && f.color !== 'all') n++
  if (f.inStock) n++
  if (f.minPrice !== undefined || f.maxPrice !== undefined) n++
  return n
}
