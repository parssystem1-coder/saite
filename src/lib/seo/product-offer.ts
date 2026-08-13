import { tomanToRial } from '@/lib/money'

/**
 * بلوک Offer برای JSON-LD محصول.
 *
 * قیمت ویرایشگر به تومان است؛ Google با `priceCurrency: IRR` مبلغ ریال می‌خواهد.
 * این تابع را هم پیش‌نمایش ادمین و هم صفحهٔ عمومی صدا می‌زنند تا ساختار یکی بماند.
 * هرگز لینک مارک‌داون نساز — `availability` باید URL خام schema.org باشد.
 */

export const SCHEMA_ORG_IRR = 'IRR' as const

const AVAILABILITY_URL: Record<string, string> = {
  in_stock: 'https://schema.org/InStock',
  low_stock: 'https://schema.org/LimitedAvailability',
  out_of_stock: 'https://schema.org/OutOfStock',
  on_request: 'https://schema.org/LimitedAvailability',
  pre_order: 'https://schema.org/PreOrder',
  coming_soon: 'https://schema.org/PreOrder',
}

const CONDITION_URL: Record<string, string> = {
  new: 'https://schema.org/NewCondition',
  stock: 'https://schema.org/NewCondition',
  used: 'https://schema.org/UsedCondition',
  refurbished: 'https://schema.org/RefurbishedCondition',
}

export type ProductOfferLd = {
  '@type': 'Offer'
  priceCurrency: typeof SCHEMA_ORG_IRR
  price: string
  availability: string
  itemCondition: string
  url?: string
}

export type ProductOfferInput = {
  priceToman?: number | ''
  salePriceToman?: number | ''
  stockStatus: string
  condition?: string
  url?: string
}

function isPositiveToman(value: number | '' | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
}

/** قیمت فروش: تخفیف معتبر، وگرنه قیمت مصرف‌کننده. */
export function resolveOfferPriceToman(
  priceToman: number | '' | undefined,
  salePriceToman?: number | ''
): number | undefined {
  if (isPositiveToman(salePriceToman)) return salePriceToman
  if (isPositiveToman(priceToman)) return priceToman
  return undefined
}

export function schemaAvailabilityUrl(stockStatus: string): string {
  return AVAILABILITY_URL[stockStatus] ?? 'https://schema.org/InStock'
}

export function schemaItemConditionUrl(condition: string | undefined): string {
  if (!condition) return CONDITION_URL.new
  return CONDITION_URL[condition] ?? CONDITION_URL.new
}

/** اگر قیمت معتبر نباشد `undefined` — گوگل از Offer با قیمت ۰ خطا می‌گیرد. */
export function buildProductOfferLd(input: ProductOfferInput): ProductOfferLd | undefined {
  const toman = resolveOfferPriceToman(input.priceToman, input.salePriceToman)
  if (toman === undefined) return undefined

  const offer: ProductOfferLd = {
    '@type': 'Offer',
    priceCurrency: SCHEMA_ORG_IRR,
    price: String(tomanToRial(toman)),
    availability: schemaAvailabilityUrl(input.stockStatus),
    itemCondition: schemaItemConditionUrl(input.condition),
  }

  const url = input.url?.trim()
  if (url) offer.url = url
  return offer
}
