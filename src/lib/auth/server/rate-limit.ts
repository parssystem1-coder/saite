import 'server-only'

/**
 * محدودیت نرخ ورود — سمت سرور، بر اساس IP.
 *
 * ── تفاوت با `useLoginThrottle` ───────────────────────────────
 * آن hook در حافظهٔ کامپوننت است: با رفرش صفحه پاک می‌شود و با
 * curl اصلاً وجود ندارد. فقط تجربهٔ کاربر را بهتر می‌کند.
 *
 * این ماژول واقعاً محدود می‌کند، چون مهاجم به حافظهٔ سرور دسترسی
 * ندارد.
 *
 * ── محدودیت صادقانه ───────────────────────────────────────────
 * شمارنده در حافظهٔ process است، پس:
 *   • با ری‌استارت سرور صفر می‌شود
 *   • روی چند instance (serverless / چند container) مشترک نیست
 *
 * برای یک فروشگاه تک-سروره کافی است. اگر روزی افقی مقیاس دادید،
 * این را با Redis یا Upstash جایگزین کنید — رابط تابع همان
 * می‌ماند و فقط بدنه عوض می‌شود.
 */

interface Bucket {
  count: number
  resetAt: number
}

const buckets = new Map<string, Bucket>()

/** پاک‌سازی سطل‌های منقضی تا حافظه بی‌نهایت رشد نکند */
function sweep(now: number): void {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key)
  }
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

  // هر بار که سطل‌ها بزرگ شدند، منقضی‌ها را پاک کن
  if (buckets.size > 512) sweep(now)

  const existing = buckets.get(key)

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: maxAttempts - 1, retryAfterSeconds: 0 }
  }

  existing.count += 1

  if (existing.count > maxAttempts) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    }
  }

  return {
    allowed: true,
    remaining: maxAttempts - existing.count,
    retryAfterSeconds: 0,
  }
}

/** صفر کردن شمارنده پس از ورود موفق */
export function resetRateLimit(key: string): void {
  buckets.delete(key)
}

/** فقط برای تست — پاک‌کردن کامل وضعیت */
export function __resetAllRateLimits(): void {
  buckets.clear()
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
