import 'server-only'

import {
  createFileStore,
  createMemoryStore,
  DEFAULT_RATE_LIMIT_PATH,
  type RateLimitStore,
} from '@/lib/auth/server/rate-limit-store'

/**
 * محدودیت نرخ ورود — سمت سرور، بر اساس IP.
 *
 * ── تفاوت با `useLoginThrottle` ───────────────────────────────
 * آن hook در حافظهٔ کامپوننت است: با رفرش صفحه پاک می‌شود و با
 * curl اصلاً وجود ندارد. فقط تجربهٔ کاربر را بهتر می‌کند.
 *
 * این ماژول واقعاً محدود می‌کند، چون مهاجم به وضعیت سرور دسترسی
 * ندارد.
 *
 * ── پایداری ───────────────────────────────────────────────────
 * شمارنده روی دیسک ذخیره می‌شود (`rate-limit-store.ts`). پیش از
 * این فقط در حافظهٔ process بود و با هر ری‌استارت صفر می‌شد —
 * یعنی مهاجم فقط کافی بود منتظر یک deploy بماند.
 *
 * در تست از نسخهٔ حافظه‌ای استفاده می‌شود تا فایل‌های موقت
 * ناخواسته ساخته نشوند.
 */

const store: RateLimitStore =
  process.env.NODE_ENV === 'test'
    ? createMemoryStore()
    : createFileStore(DEFAULT_RATE_LIMIT_PATH)

/** هر چند عملیات یک‌بار سطل‌های منقضی پاک شوند */
const SWEEP_INTERVAL = 64
let operationCount = 0

function maybeSweep(now: number): void {
  operationCount += 1
  if (operationCount % SWEEP_INTERVAL === 0) store.sweep(now)
}

export interface RateLimitResult {
  /** آیا درخواست مجاز است؟ */
  allowed: boolean
  /** تلاش‌های باقی‌مانده در این پنجره */
  remaining: number
  /** ثانیه تا باز شدن — وقتی allowed=false */
  retryAfterSeconds: number
}

/**
 * ثبت یک تلاش و بررسی سقف.
 *
 * @param key شناسهٔ یکتا — معمولاً IP
 * @param maxAttempts سقف تلاش در پنجره
 * @param windowMs طول پنجره به میلی‌ثانیه
 */
export function consumeRateLimit(
  key: string,
  maxAttempts: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now()
  maybeSweep(now)

  const existing = store.get(key)

  if (!existing || existing.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: maxAttempts - 1, retryAfterSeconds: 0 }
  }

  const next = { count: existing.count + 1, resetAt: existing.resetAt }
  store.set(key, next)

  if (next.count > maxAttempts) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((next.resetAt - now) / 1000)),
    }
  }

  return {
    allowed: true,
    remaining: maxAttempts - next.count,
    retryAfterSeconds: 0,
  }
}

/** صفر کردن شمارنده پس از ورود موفق */
export function resetRateLimit(key: string): void {
  store.delete(key)
}

/** فقط برای تست — پاک‌کردن کامل وضعیت */
export function __resetAllRateLimits(): void {
  store.clear()
}

/**
 * استخراج IP از هدرهای درخواست.
 *
 * پشت پراکسی (Vercel، Cloudflare، nginx) آدرس واقعی در هدر است.
 * اگر هیچ‌کدام نبود، یک کلید ثابت برمی‌گردانیم — یعنی همهٔ
 * درخواست‌های بدون IP یک سطل مشترک دارند. این محافظه‌کارانه است
 * و در بدترین حالت کمی سخت‌گیرتر عمل می‌کند.
 */
export function getClientKey(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for')
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim()
    if (first) return first
  }
  return headers.get('x-real-ip')?.trim() || 'unknown-client'
}
