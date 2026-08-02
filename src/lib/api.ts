import { httpJson, isMockMode } from '@/lib/api-client'
import type { ProductListQuery, ProductListResult } from '@/lib/api-types'
import { PRODUCTS } from '@/lib/mock-data'
import { applyFilters } from '@/lib/product-filters'
import type { CategorySlug, Product } from '@/types/product'

/**
 * لایهٔ دسترسی به داده — تنها درگاه بین UI و منبع داده.
 *
 * ── قرارداد ────────────────────────────────────────────────────
 *  • کامپوننت‌ها فقط از `@/lib/api` import می‌کنند.
 *  • import مستقیم `@/lib/mock-data` بیرون از `lib/` ممنوع است.
 *  • با NEXT_PUBLIC_USE_MOCK=false بدنه به HTTP سوییچ می‌شود
 *    (نیاز به NEXT_PUBLIC_API_BASE_URL و Route Handler واقعی).
 *
 * ── مهاجرت به بک‌اند ───────────────────────────────────────────
 *  فقط همین فایل (و api-client) را عوض کنید؛ امضای توابع ثابت می‌ماند.
 */

const DEFAULT_PER_PAGE = 9

// ── فهرست و جستجو ─────────────────────────────────────────────

/**
 * فهرست محصولات با فیلتر و صفحه‌بندی.
 *
 * بدون آرگومان: همهٔ محصولات (سازگار با sitemap، ادمین، design-system).
 * با query: فیلتر + slice صفحه‌بندی‌شده.
 */
export async function getProducts(query?: ProductListQuery): Promise<Product[]>
export async function getProducts(query: ProductListQuery & { page: number }): Promise<ProductListResult>
export async function getProducts(
  query?: ProductListQuery
): Promise<Product[] | ProductListResult> {
  if (!isMockMode()) {
    return httpGetProducts(query)
  }
  return mockGetProducts(query)
}

/** نسخهٔ صریح صفحه‌بندی‌شده — برای کاتالوگ */
export async function getProductList(
  query: ProductListQuery = {}
): Promise<ProductListResult> {
  const page = Math.max(1, query.page ?? 1)
  const perPage = Math.max(1, query.perPage ?? DEFAULT_PER_PAGE)

  if (!isMockMode()) {
    return httpJson<ProductListResult>(
      `/api/products?${toSearchParams({ ...query, page, perPage })}`
    )
  }

  const filtered = applyFilters(PRODUCTS, query)
  const total = filtered.length
  const totalPages = Math.max(1, Math.ceil(total / perPage))
  const safePage = Math.min(page, totalPages)
  const start = (safePage - 1) * perPage

  return {
    items: filtered.slice(start, start + perPage),
    total,
    page: safePage,
    perPage,
    totalPages,
  }
}

// ── تک‌محصول و روابط ──────────────────────────────────────────

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  if (!isMockMode()) {
    try {
      return await httpJson<Product>(`/api/products/by-slug/${encodeURIComponent(slug)}`)
    } catch {
      return undefined
    }
  }
  return PRODUCTS.find((p) => p.slug === slug)
}

export async function getProductById(id: string): Promise<Product | undefined> {
  if (!isMockMode()) {
    try {
      return await httpJson<Product>(`/api/products/${encodeURIComponent(id)}`)
    } catch {
      return undefined
    }
  }
  return PRODUCTS.find((p) => p.id === id)
}

export async function getProductsByCategory(category: CategorySlug): Promise<Product[]> {
  const list = await getProductList({ category, perPage: 500 })
  return list.items
}

export async function getFeaturedProducts(): Promise<Product[]> {
  if (!isMockMode()) {
    return httpJson<Product[]>('/api/products?featured=1')
  }
  return PRODUCTS.filter((p) => p.isFeatured)
}

export async function getBestSellers(): Promise<Product[]> {
  if (!isMockMode()) {
    return httpJson<Product[]>('/api/products?bestSeller=1')
  }
  return PRODUCTS.filter((p) => p.isBestSeller)
}

/**
 * موتور «یافتن قطعهٔ سازگار».
 * مصرفی/قطعه‌هایی که compatibleWith شامل مدل دستگاه است.
 */
export async function getCompatibleItems(deviceModel: string): Promise<Product[]> {
  const needle = deviceModel.trim().toLowerCase()
  if (!needle) return []

  if (!isMockMode()) {
    return httpJson<Product[]>(
      `/api/products/compatible?model=${encodeURIComponent(deviceModel)}`
    )
  }

  return PRODUCTS.filter((p) =>
    p.compatibleWith?.some((m) => m.toLowerCase() === needle)
  )
}

/** فهرست مدل دستگاه‌هایی که برایشان مصرفی یا قطعه داریم */
export async function getSupportedDeviceModels(): Promise<
  { brand: string; model: string }[]
> {
  if (!isMockMode()) {
    return httpJson<{ brand: string; model: string }[]>('/api/products/supported-models')
  }

  const seen = new Map<string, { brand: string; model: string }>()

  for (const item of PRODUCTS) {
    for (const model of item.compatibleWith ?? []) {
      if (!seen.has(model)) {
        const device = PRODUCTS.find((p) => p.model === model)
        seen.set(model, { brand: device?.brand ?? item.brand, model })
      }
    }
  }

  return [...seen.values()]
}

/** محصولات مرتبط: هم‌دسته، به‌جز خود محصول */
export async function getRelatedProducts(product: Product, limit = 4): Promise<Product[]> {
  if (!isMockMode()) {
    return httpJson<Product[]>(
      `/api/products/${encodeURIComponent(product.id)}/related?limit=${limit}`
    )
  }
  return PRODUCTS.filter((p) => p.category === product.category && p.id !== product.id).slice(
    0,
    limit
  )
}

/**
 * جهت معکوس سازگاری: «این دستگاه چه مصرفی‌ای می‌خورد؟»
 * مسیر فروش مکمل (cross-sell).
 */
export async function getConsumablesForDevice(product: Product): Promise<Product[]> {
  const ids = product.consumables
  if (!ids || ids.length === 0) return []

  if (!isMockMode()) {
    return httpJson<Product[]>(
      `/api/products/${encodeURIComponent(product.id)}/consumables`
    )
  }

  return ids
    .map((id) => PRODUCTS.find((p) => p.id === id))
    .filter((p): p is Product => Boolean(p))
}

/** محصولات مورد نیاز صفحهٔ مقایسه / علاقه‌مندی */
export async function getProductsByIds(ids: string[]): Promise<Product[]> {
  if (ids.length === 0) return []

  if (!isMockMode()) {
    return httpJson<Product[]>(`/api/products/by-ids?ids=${ids.map(encodeURIComponent).join(',')}`)
  }

  return ids
    .map((id) => PRODUCTS.find((p) => p.id === id))
    .filter((p): p is Product => Boolean(p))
}

// ── داخلی ─────────────────────────────────────────────────────

async function mockGetProducts(
  query?: ProductListQuery
): Promise<Product[] | ProductListResult> {
  // بدون query یا بدون page → آرایهٔ کامل (سازگاری عقب‌رو)
  if (!query || query.page === undefined) {
    if (!query || isEmptyFilters(query)) return PRODUCTS
    return applyFilters(PRODUCTS, query)
  }
  return getProductList(query)
}

async function httpGetProducts(
  query?: ProductListQuery
): Promise<Product[] | ProductListResult> {
  if (!query || query.page === undefined) {
    const result = await httpJson<ProductListResult>(
      `/api/products?${toSearchParams({ ...query, page: 1, perPage: 10_000 })}`
    )
    return result.items
  }
  return httpJson<ProductListResult>(`/api/products?${toSearchParams(query)}`)
}

function isEmptyFilters(q: ProductListQuery): boolean {
  const { page: _p, perPage: _pp, sort, ...rest } = q
  if (sort && sort !== 'newest') return false
  return Object.values(rest).every(
    (v) => v === undefined || v === '' || v === 'all' || v === false
  )
}

function toSearchParams(query: ProductListQuery): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '' || value === 'all') continue
    if (value === false) continue
    if (value === true) {
      params.set(key, '1')
      continue
    }
    params.set(key, String(value))
  }
  return params.toString()
}
