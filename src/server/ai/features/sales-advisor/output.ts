import 'server-only'
import { z } from 'zod'
import { prisma } from '@/server/shared/db'
import type {
  PriceType,
  ProductCardData,
  ProductCondition,
  StockStatus,
} from '@/types/product'

/** ردیف سیلکت‌شدهٔ Prisma — ساختارش با `select` کوئری زیر یکی است */
interface SuggestedProductRow {
  id: string
  slug: string
  brand: string
  model: string
  name: string
  category: string
  priceType: PriceType
  price: number | null
  compareAtPrice: number | null
  stockStatus: StockStatus
  images: string[]
  keyFeatures: string[]
  condition: ProductCondition
}

/**
 * تحلیل و اعتبارسنجی خروجی مدل — قانون امنیتی کلیدی چتبات.
 *
 * ── چرا این لایه وجود دارد؟ ───────────────────────────────────
 * قانون امنیتی: «هر خروجی AI که اثر واقعی دارد (مثلاً ارجاع به
 * محصول) باید اعتبارسنجی شود — فقط مقادیر معتبرِ موجود در دیتابیس
 * پذیرفته شوند».
 *
 * مدل می‌تواند هر شناسه‌ای را در بلاک پیشنهادها بنویسد — اشتباه،
 * توهین‌آمیز، یا ناشی از prompt injection. ما:
 *   ۱. بلاک را با اسکیمای zod سخت‌گیرانه می‌خوانیم،
 *   ۲. فقط شناسه‌هایی را عبور می‌دهیم که واقعاً در دیتابیس هستند،
 *   ۳. خودِ بلاک را از متن قابل نمایش به کاربر حذف می‌کنیم.
 */

export const SUGGESTION_BLOCK_OPEN = '<<SUGGESTED_PRODUCTS>>'
export const SUGGESTION_BLOCK_CLOSE = '<<END_SUGGESTED_PRODUCTS>>'

/** حداکثر تعداد محصول در خروجی — حتی اگر مدل بیشتر بنویسد */
export const MAX_SUGGESTED_PRODUCTS = 3

const suggestionItemSchema = z.object({
  id: z.string().min(1).max(64),
})
// عمداً بدون max روی آرایه: کارش زیادی مدل به‌جای سقوط کامل پاسخ،
// فقط به سقف سخت‌گیرانه بریده می‌شود.
const suggestionBlockSchema = z.array(suggestionItemSchema).max(20)

export interface ParsedAdvisorOutput {
  /** متن پاک‌شده — بدون بلاک پیشنهادها، امن برای نمایش */
  cleanText: string
  /** شناسه‌های پیشنهادیِ خام (هنوز با دیتابیس اعتبارسنجی نشده) */
  rawSuggestedIds: string[]
}

/**
 * جدا کردن بلاک پیشنهادها از متن پاسخ.
 * حتی اگر JSON داخل بلاک خراب باشد، خود بلاك از متن کاربر حذف می‌شود
 * تا نشانه‌های داخلی هرگز در UI دیده نشوند.
 */
export function parseAdvisorOutput(rawText: string): ParsedAdvisorOutput {
  const openIndex = rawText.indexOf(SUGGESTION_BLOCK_OPEN)
  if (openIndex === -1) {
    return { cleanText: rawText.trim(), rawSuggestedIds: [] }
  }

  const closeIndex = rawText.indexOf(SUGGESTION_BLOCK_CLOSE, openIndex)
  const blockContent = rawText.slice(
    openIndex + SUGGESTION_BLOCK_OPEN.length,
    closeIndex === -1 ? undefined : closeIndex
  )
  const cleanText = (
    rawText.slice(0, openIndex) + (closeIndex === -1 ? '' : rawText.slice(closeIndex + SUGGESTION_BLOCK_CLOSE.length))
  ).trim()

  let rawSuggestedIds: string[] = []
  try {
    const parsed = suggestionBlockSchema.safeParse(JSON.parse(blockContent))
    if (parsed.success) {
      rawSuggestedIds = [...new Set(parsed.data.map((item) => item.id))].slice(
        0,
        MAX_SUGGESTED_PRODUCTS
      )
    }
  } catch {
    // JSON خراب = هیچ پیشنهادی؛ متن پاک‌شده همچنان معتبر است
  }

  return { cleanText, rawSuggestedIds }
}

/**
 * فقط شناسه‌های موجود در دیتابیس را برمی‌گرداند — در همان ترتیب پیشنهاد مدل.
 * هر شناسهٔ نامعتبر بی‌صدا حذف می‌شود.
 */
export async function validateSuggestions(ids: string[]): Promise<ProductCardData[]> {
  if (ids.length === 0) return []

  // cast به ردیفِ محلی: در محیط‌های بدون generate (مثل CI بدون
  // engine) خروجی Prisma any می‌شود؛ به‌هر‌حال منطق ما روی
  // قرارداد سیلکت قفل شده است.
  const products = (await prisma.product.findMany({
    where: { id: { in: ids.slice(0, MAX_SUGGESTED_PRODUCTS) } },
    select: {
      id: true,
      slug: true,
      brand: true,
      model: true,
      name: true,
      category: true,
      priceType: true,
      price: true,
      compareAtPrice: true,
      stockStatus: true,
      images: true,
      keyFeatures: true,
      condition: true,
    },
  })) as SuggestedProductRow[]

  const byId = new Map(products.map((product) => [product.id, product]))
  const result: ProductCardData[] = []
  for (const id of ids) {
    const product = byId.get(id)
    if (!product) continue
    result.push({
      id: product.id,
      slug: product.slug,
      brand: product.brand,
      model: product.model,
      name: product.name,
      category: product.category as ProductCardData['category'],
      priceType: product.priceType,
      price: product.price ?? undefined,
      compareAtPrice: product.compareAtPrice ?? undefined,
      stockStatus: product.stockStatus,
      images: product.images,
      keyFeatures: product.keyFeatures,
      condition: product.condition,
    })
    if (result.length >= MAX_SUGGESTED_PRODUCTS) break
  }
  return result
}
