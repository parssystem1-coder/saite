import { PRODUCTS } from '@/lib/mock-data'
import type { CategorySlug, Product } from '@/types/product'

/**
 * لایهٔ دسترسی به داده — فاز ۱ (Mock).
 *
 * امضای این توابع عمداً به‌گونه‌ای طراحی شده که هنگام اتصال بک‌اند
 * (Prisma/PostgreSQL) فقط بدنه تغییر کند و هیچ کامپوننتی دست نخورد.
 * تأخیر مصنوعی قبلی (۸۰۰ms) حذف شده چون مستقیماً به LCP آسیب می‌زد.
 */

export async function getProducts(): Promise<Product[]> {
  return PRODUCTS
}

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  return PRODUCTS.find((p) => p.slug === slug)
}

export async function getProductById(id: string): Promise<Product | undefined> {
  return PRODUCTS.find((p) => p.id === id)
}

export async function getProductsByCategory(category: CategorySlug): Promise<Product[]> {
  return PRODUCTS.filter((p) => p.category === category)
}

export async function getFeaturedProducts(): Promise<Product[]> {
  return PRODUCTS.filter((p) => p.isFeatured)
}

export async function getBestSellers(): Promise<Product[]> {
  return PRODUCTS.filter((p) => p.isBestSeller)
}

/**
 * موتور «یافتن قطعهٔ سازگار».
 * با دریافت مدل یک دستگاه، تمام مصرفی‌ها و قطعاتی را برمی‌گرداند
 * که در فیلد compatibleWith خود به آن مدل اشاره کرده‌اند.
 */
export async function getCompatibleItems(deviceModel: string): Promise<Product[]> {
  const needle = deviceModel.trim().toLowerCase()
  if (!needle) return []

  return PRODUCTS.filter((p) =>
    p.compatibleWith?.some((m) => m.toLowerCase() === needle)
  )
}

/** فهرست مدل دستگاه‌هایی که برایشان مصرفی یا قطعه داریم */
export async function getSupportedDeviceModels(): Promise<
  { brand: string; model: string }[]
> {
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
  return PRODUCTS.filter((p) => p.category === product.category && p.id !== product.id).slice(
    0,
    limit
  )
}

/**
 * جهت معکوس موتور سازگاری: «این دستگاه چه مصرفی‌ای می‌خورد؟»
 *
 * getCompatibleItems از مصرفی به دستگاه می‌رسد؛ این تابع برعکس عمل
 * می‌کند و روی صفحهٔ دستگاه، تونر و قطعات آن را پیشنهاد می‌دهد.
 * این مسیر، فروش مکمل (cross-sell) اصلی فروشگاه است.
 */
export async function getConsumablesForDevice(product: Product): Promise<Product[]> {
  const ids = product.consumables
  if (!ids || ids.length === 0) return []

  // ترتیب تعریف‌شده در consumables حفظ می‌شود
  return ids
    .map((id) => PRODUCTS.find((p) => p.id === id))
    .filter((p): p is Product => Boolean(p))
}

/** محصولات مورد نیاز صفحهٔ مقایسه */
export async function getProductsByIds(ids: string[]): Promise<Product[]> {
  return ids
    .map((id) => PRODUCTS.find((p) => p.id === id))
    .filter((p): p is Product => Boolean(p))
}
