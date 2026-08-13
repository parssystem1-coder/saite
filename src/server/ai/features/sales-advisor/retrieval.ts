import 'server-only'
import { prisma } from '@/server/shared/db'
import type { PriceType, StockStatus } from '@/types/product'

/**
 * بازیابی کانتکست کاتالوگ برای مشاور فروش.
 *
 * ── چرا جست‌وجوی کلیدواژه‌ای DB و نه فرستادن کل کاتالوگ؟ ──────
 * فرستادن کل کاتالوگ در هر پیام به مدل یعنی هزینهٔ توکن خطیِ
 * بالا در هر گفتگو و احتمال hallucination بیشتر. در عوض با یک
 * جست‌وجوی سبک، ۶ محصول مرتبط‌تر را تزریق می‌کنیم؛ اگر هیچ نتیجه‌ای
 * نبود، محصولات منتخب/پرفروش فروشگاه کانتکست می‌شوند تا مدل هیچ
 * وقت «نامه‌ای از کاتالوگ غیب» نسازد.
 */

export interface AdvisorCatalogProduct {
  id: string
  name: string
  brand: string
  model: string
  category: string
  priceType: PriceType
  /** قیمت‌های نامشخص به null تبدیل می‌شوند تا در پرامپت «استعلام» شوند */
  price: number | null
  stockStatus: StockStatus
  keyFeatures: string[]
}

const MAX_TOKENS_IN_QUERY = 5
const SEARCH_RESULT_LIMIT = 6
const FALLBACK_RESULT_LIMIT = 4

/** کلمات تکراری و کوتاه فارسی/لاتین که ارزش جست‌وجو ندارند */
const QUESTION_STOPWORDS = new Set([
  'این', 'آن', 'هایی', 'است', 'بود', 'هست', 'چه', 'چی', 'چیه',
  'برای', 'با', 'به', 'از', 'در', 'را', 'که', 'من', 'میخوام', 'می‌خوام',
  'یک', 'دنبال', 'قیمت', 'قیمتش', 'دارید', 'داری', 'لطفا', 'لطفاً',
  'the', 'for', 'and', 'with', 'what', 'price',
])

function extractKeywords(message: string): string[] {
  const tokens = message
    .split(/[\s،.!؟?؛:()\[\]"']+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2 && !QUESTION_STOPWORDS.has(t))
  return [...new Set(tokens)].slice(0, MAX_TOKENS_IN_QUERY)
}

function toCatalogProduct(product: {
  id: string
  name: string
  brand: string
  model: string
  category: string
  priceType: PriceType
  price: number | null
  stockStatus: StockStatus
  keyFeatures: string[]
}): AdvisorCatalogProduct {
  return {
    id: product.id,
    name: product.name,
    brand: product.brand,
    model: product.model,
    category: product.category,
    priceType: product.priceType,
    price: product.price,
    stockStatus: product.stockStatus,
    keyFeatures: product.keyFeatures,
  }
}

const PRODUCT_SELECT = {
  id: true,
  name: true,
  brand: true,
  model: true,
  category: true,
  priceType: true,
  price: true,
  stockStatus: true,
  keyFeatures: true,
} as const

/**
 * اسنپ‌شات کوچک کاتالوگ مرتبط با پیام کاربر.
 * خروجی فقط دادهٔ عمومی محصول است — هیچ دادهٔ حساسی در پرامپت نمی‌رود.
 */
export async function retrieveRelevantProducts(message: string): Promise<AdvisorCatalogProduct[]> {
  const keywords = extractKeywords(message)

  if (keywords.length > 0) {
    const matched = await prisma.product.findMany({
      where: {
        OR: keywords.flatMap((kw) => [
          { name: { contains: kw, mode: 'insensitive' as const } },
          { brand: { contains: kw, mode: 'insensitive' as const } },
          { model: { contains: kw, mode: 'insensitive' as const } },
        ]),
      },
      select: PRODUCT_SELECT,
      // محصولات موجود و متمایز فروشگاه جلوتر دیده شوند
      orderBy: [
        { stockStatus: 'asc' },
        { isFeatured: 'desc' },
        { isBestSeller: 'desc' },
      ],
      take: SEARCH_RESULT_LIMIT,
    })
    if (matched.length > 0) return matched.map(toCatalogProduct)
  }

  // بدون نتیجهٔ کلیدواژه‌ای → کالکشن منتخب/پرفروش فروشگاه
  const fallback = await prisma.product.findMany({
    where: { OR: [{ isFeatured: true }, { isBestSeller: true }] },
    select: PRODUCT_SELECT,
    orderBy: [{ isFeatured: 'desc' }, { isBestSeller: 'desc' }],
    take: FALLBACK_RESULT_LIMIT,
  })
  return fallback.map(toCatalogProduct)
}
