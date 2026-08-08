import { httpJson } from '@/lib/api-client'
import type { ProductListQuery, ProductListResult } from '@/lib/api-types'
import type { Product } from '@/types/product'

/**
 * http-adapter برای products — پیاده‌سازی همان interface که mock-adapter دارد.
 * وقتی NEXT_PUBLIC_USE_MOCK=false، api.ts این adapter را صدا می‌زند.
 */

export const httpProductsAdapter = {
  async getProductList(query: ProductListQuery): Promise<ProductListResult> {
    const params = new URLSearchParams()
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === '' || value === 'all') continue
      if (value === false) continue
      if (value === true) { params.set(key, '1'); continue }
      params.set(key, String(value))
    }
    return httpJson<ProductListResult>(`/api/products?${params.toString()}`)
  },

  async getProductBySlug(slug: string): Promise<Product | undefined> {
    try {
      return await httpJson<Product>(`/api/products/by-slug/${encodeURIComponent(slug)}`)
    } catch {
      return undefined
    }
  },

  async getProductById(id: string): Promise<Product | undefined> {
    try {
      return await httpJson<Product>(`/api/products/${encodeURIComponent(id)}`)
    } catch {
      return undefined
    }
  },

  async getProducts(): Promise<Product[]> {
    const result = await this.getProductList({ page: 1, perPage: 10000 })
    return result.items
  },
}
