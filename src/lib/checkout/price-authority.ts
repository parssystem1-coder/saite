import 'server-only'

import { getProductsByIds } from '@/lib/api'
import type { CartLine } from '@/store/cart-store'

/**
 * مرجع قیمت — تنها جایی که مبلغ قابل پرداخت تعیین می‌شود.
 *
 * ══════════════════════════════════════════════════════════════
 *  چرا این فایل لازم است
 * ══════════════════════════════════════════════════════════════
 * سبد خرید در `localStorage` مرورگر است. یعنی هر عددی که از آن
 * می‌آید — قیمت، تخفیف، مجموع — دادهٔ **کاربر** است، نه دادهٔ ما.
 * پذیرفتنش مثل این است که به مشتری بگویید خودت روی برچسب قیمت
 * بنویس.
 *
 * قانون: از سبد فقط `id` و `quantity` را بگیرید. هر چیز دیگری را
 * دور بریزید و از منبع داده بخوانید.
 *
 * ── چرا الان و نه بعد از اتصال بک‌اند؟ ────────────────────────
 * چون الان که دادهٔ mock است، این تابع رایگان نوشته می‌شود. بعد
 * از اینکه جریان پرداخت روی `totalPrice()` کلاینت سوار شد، عوض
 * کردنش یعنی بازنویسی مسیر تسویه.
 *
 * ── محدودیت فعلی ──────────────────────────────────────────────
 * تا وقتی `NEXT_PUBLIC_USE_MOCK=true` است، «منبع داده» همان فایل
 * mock است. یعنی این تابع هنوز حملهٔ واقعی را نمی‌بندد؛ **شکل
 * درست** را می‌بندد تا وقتی دیتابیس آمد فقط `getProductsByIds`
 * عوض شود.
 */

/** حداکثر تعداد مجاز هر ردیف — جلوی سفارش ۹۹۹۹۹ تایی تصادفی */
const MAX_QUANTITY_PER_LINE = 20

/** حداکثر تعداد ردیف در یک سفارش */
const MAX_LINES = 50

export interface PricedLine {
  id: string
  slug: string
  name: string
  quantity: number
  /** قیمت واحد، از منبع داده — نه از کلاینت */
  unitPrice: number
  lineTotal: number
}

export type RejectionReason =
  | 'not-found'
  | 'quote-only'
  | 'out-of-stock'
  | 'invalid-quantity'

export interface RejectedLine {
  id: string
  reason: RejectionReason
}

export interface RepricedCart {
  lines: PricedLine[]
  rejected: RejectedLine[]
  /** مبلغ معتبر — تنها عددی که به درگاه پرداخت می‌رود */
  total: number
}

/**
 * قیمت‌گذاری مجدد سبد از روی منبع داده.
 *
 * ورودی عمداً فقط `id` و `quantity` است. اگر روزی کسی وسوسه شد
 * `price` را هم پارامتر کند، همین‌جا جلویش را بگیرید — آن لحظه
 * دقیقاً همان جایی است که باگ برمی‌گردد.
 */
export async function repriceCart(lines: CartLine[]): Promise<RepricedCart> {
  const rejected: RejectedLine[] = []

  /*
    یکسان‌سازی ورودی: تکراری‌ها ادغام و تعدادها اعتبارسنجی
    می‌شوند. بدون این، کلاینت می‌تواند یک id را ۱۰۰ بار بفرستد و
    سقف تعداد را دور بزند.
  */
  const normalized = new Map<string, number>()

  for (const line of lines.slice(0, MAX_LINES)) {
    const quantity = Math.floor(Number(line.quantity))

    if (!line.id || !Number.isFinite(quantity) || quantity <= 0) {
      rejected.push({ id: String(line.id ?? ''), reason: 'invalid-quantity' })
      continue
    }

    normalized.set(line.id, (normalized.get(line.id) ?? 0) + quantity)
  }

  const ids = [...normalized.keys()]
  if (ids.length === 0) return { lines: [], rejected, total: 0 }

  const products = await getProductsByIds(ids)
  const byId = new Map(products.map((product) => [product.id, product]))

  const priced: PricedLine[] = []

  for (const [id, rawQuantity] of normalized) {
    const product = byId.get(id)

    if (!product) {
      rejected.push({ id, reason: 'not-found' })
      continue
    }

    if (product.priceType !== 'fixed' || product.price === undefined) {
      rejected.push({ id, reason: 'quote-only' })
      continue
    }

    if (product.stockStatus === 'out_of_stock') {
      rejected.push({ id, reason: 'out-of-stock' })
      continue
    }

    // سقف بی‌سروصدا اعمال می‌شود، نه اینکه کل ردیف رد شود
    const quantity = Math.min(rawQuantity, MAX_QUANTITY_PER_LINE)

    priced.push({
      id: product.id,
      slug: product.slug,
      name: product.name,
      quantity,
      unitPrice: product.price,
      lineTotal: product.price * quantity,
    })
  }

  return {
    lines: priced,
    rejected,
    total: priced.reduce((sum, line) => sum + line.lineTotal, 0),
  }
}
