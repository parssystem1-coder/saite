import type { ProductCardData } from '@/types/product'

const STORAGE_KEY = 'saite:recently-viewed'
const MAX_ITEMS = 8

export type RecentProduct = Pick<
  ProductCardData,
  'id' | 'slug' | 'name' | 'brand' | 'model' | 'images' | 'priceType' | 'price' | 'stockStatus'
>

/**
 * فهرست اخیراً دیده‌شده — منبع خارجی برای useSyncExternalStore.
 *
 * ── دو قاعدهٔ حیاتی این ماژول ─────────────────────────────────
 *
 * ۱) getSnapshot باید **همان reference** را برگرداند تا وقتی داده
 *    عوض نشده. React خروجی را با Object.is مقایسه می‌کند؛ اگر هر
 *    بار آرایهٔ تازه بسازیم، حلقهٔ بی‌نهایت رندر می‌شود:
 *    «The result of getSnapshot should be cached to avoid an infinite loop»
 *    برای همین نتیجهٔ parse در cache نگه داشته می‌شود و فقط وقتی
 *    رشتهٔ خام sessionStorage عوض شود، دوباره ساخته می‌شود.
 *
 * ۲) رویداد `storage` مرورگر فقط در **تب‌های دیگر** fire می‌شود، نه
 *    در تبی که نوشته است. بدون ناظر داخلی، نوشتن و خواندن در یک
 *    صفحه هرگز به هم وصل نمی‌شدند.
 */

// ── cache برای پایداری reference ──────────────────────────────
const EMPTY: readonly RecentProduct[] = Object.freeze([])

let cachedRaw: string | null = null
let cachedList: readonly RecentProduct[] = EMPTY

// ── ناظران هم‌تب ──────────────────────────────────────────────
const listeners = new Set<() => void>()

function notifyListeners(): void {
  for (const listener of listeners) listener()
}

function isRecentProduct(value: unknown): value is RecentProduct {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  return (
    typeof v.id === 'string' &&
    typeof v.slug === 'string' &&
    typeof v.name === 'string' &&
    Array.isArray(v.images)
  )
}

function parseRaw(raw: string | null): readonly RecentProduct[] {
  if (!raw) return EMPTY
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return EMPTY
    const valid = parsed.filter(isRecentProduct)
    return valid.length > 0 ? Object.freeze(valid) : EMPTY
  } catch {
    return EMPTY
  }
}

function readStorage(): string | null {
  if (typeof window === 'undefined') return null
  try {
    return sessionStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

function writeRaw(items: RecentProduct[]): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX_ITEMS)))
  } catch {
    /* حالت private یا storage غیرفعال */
  }
}

/**
 * snapshot پایدار.
 * تا وقتی رشتهٔ ذخیره‌شده عوض نشود، همان آرایهٔ قبلی برمی‌گردد.
 */
export function getRecentlyViewedSnapshot(): readonly RecentProduct[] {
  const raw = readStorage()
  if (raw !== cachedRaw) {
    cachedRaw = raw
    cachedList = parseRaw(raw)
  }
  return cachedList
}

/** snapshot سمت سرور — همیشه یک reference ثابت */
export function getServerSnapshot(): readonly RecentProduct[] {
  return EMPTY
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

  const rest = getRecentlyViewedSnapshot().filter((p) => p.id !== entry.id)
  writeRaw([entry, ...rest])

  // همان تب هم باید بفهمد — رویداد storage اینجا fire نمی‌شود
  notifyListeners()
}

/** خواندن ساده (بدون cache) — برای تست و مصارف غیر React */
export function getRecentlyViewed(excludeId?: string): RecentProduct[] {
  const list = getRecentlyViewedSnapshot()
  return excludeId ? list.filter((p) => p.id !== excludeId) : [...list]
}

/** پاک‌کردن فهرست */
export function clearRecentlyViewed(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignore */
  }
  notifyListeners()
}

/**
 * اشتراک در تغییرات — هم تب فعلی و هم تب‌های دیگر.
 */
export function subscribeRecentlyViewed(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {}

  listeners.add(callback)

  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY || e.key === null) callback()
  }
  window.addEventListener('storage', onStorage)

  return () => {
    listeners.delete(callback)
    window.removeEventListener('storage', onStorage)
  }
}

/** فقط برای تست — بازنشانی cache ماژول */
export function __resetRecentlyViewedCache(): void {
  cachedRaw = null
  cachedList = EMPTY
}
