import 'server-only'
import { NextRequest } from 'next/server'
import { checkMutationRateLimit } from './http-utils'

/**
 * جدول متمرکز سقف نرخ mutationها — یک منبع حقیقت برای ممیزی امنیتی.
 *
 * هر route بدون سقف نرخ باید یک کلید اینجا داشته باشد و با
 * `checkRouteRateLimit(req, key)` در ابتدای handler استفاده کند.
 * این جدول طوری است که ممیزی امنیتی می‌تواند در یک نگاه همهٔ
 * سقف‌ها را ببیند — و عددها در چند فایل پخش نشده‌اند.
 */
export const RATE_LIMITS = {
  'order-create': { max: 10, windowMs: 60_000 },
  'order-cancel': { max: 10, windowMs: 60_000 },
  'coupon-create': { max: 20, windowMs: 60_000 },
  'campaign-create': { max: 20, windowMs: 60_000 },
  'shipping-rate-create': { max: 20, windowMs: 60_000 },
  'shipment-create': { max: 30, windowMs: 60_000 },
  'shipment-update': { max: 30, windowMs: 60_000 },
  'product-update': { max: 30, windowMs: 60_000 },
  'content-update': { max: 30, windowMs: 60_000 },
  'emoji-write': { max: 30, windowMs: 60_000 },
} as const

export type RateLimitKey = keyof typeof RATE_LIMITS

/**
 * بررسی سقف نرخ بر اساس جدول سیاست متمرکز.
 *
 * @returns NextResponse با 429 اگر محدود شده، یا null اگر مجاز است
 */
export async function checkRouteRateLimit(
  req: NextRequest,
  key: RateLimitKey
): Promise<Response | null> {
  const { max, windowMs } = RATE_LIMITS[key]
  return checkMutationRateLimit(req, key, max, windowMs)
}
