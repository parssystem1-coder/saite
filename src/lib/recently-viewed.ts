import type { ProductCardData } from '@/types/product'

const STORAGE_KEY = 'saite:recently-viewed'
const MAX_ITEMS = 8

export type RecentProduct = Pick<
  ProductCardData,
  'id' | 'slug' | 'name' | 'brand' | 'model' | 'images' | 'priceType' | 'price' | 'stockStatus'
>

function readRaw(): RecentProduct[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? (parsed as RecentProduct[]) : []
  } catch {
    return []
  }
}

function writeRaw(items: RecentProduct[]) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX_ITEMS)))
  } catch {
    /* private mode */
  }
}

/** ثبت بازدید محصول — آخرین‌ها اول */
export function trackProductView(product: ProductCardData | RecentProduct): void {
  if (typeof window === 'undefined') return
  const entry: RecentProduct = {
    id: product.id,
    slug: product.slug,
    name: product.name,
    brand: product.brand,
    model: product.model,
    images: product.images,
    priceType: product.priceType,
    price: product.price,
    stockStatus: product.stockStatus,
  }
  const rest = readRaw().filter((p) => p.id !== entry.id)
  writeRaw([entry, ...rest])
}

export function getRecentlyViewed(excludeId?: string): RecentProduct[] {
  return readRaw().filter((p) => p.id !== excludeId)
}

export function subscribeRecentlyViewed(cb: () => void): () => void {
  if (typeof window === 'undefined') return () => {}
  const handler = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) cb()
  }
  window.addEventListener('storage', handler)
  return () => window.removeEventListener('storage', handler)
}
