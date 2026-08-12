import 'server-only'

import {
  createFileStore,
  createMemoryStore,
  createResilientRedisStore,
  DEFAULT_RATE_LIMIT_PATH,
  type RateLimitStore,
} from '@/lib/auth/server/rate-limit-store'
import { redis } from '@/server/shared/redis'

/**
 * محدودیت نرخ ورود — سمت سرور.
 *
 * ── تفاوت با `useLoginThrottle` ───────────────────────────────
 * آن hook در حافظهٔ کامپوننت است: با رفرش صفحه پاک می‌شود و با
 * curl اصلاً وجود ندارد. این ماژول واقعاً محدود می‌کند.
 *
 * ── انتخاب ذخیره‌گاه ──────────────────────────────────────────
 *   NODE_ENV=test                        → حافظه‌ای (سریع، ایزوله)
 *   RATE_LIMIT_STORE=redis (+ Redis)     → Redis (مشترک بین instance ها)
 *   پیش‌فرض                              → فایل (پایدار روی یک instance)
 *
 * اگر Redis در دسترس نباشد، به‌صورت fail-open به فایل/حافظه
 * برمی‌گردیم تا محدودیت نرخ ورود را کاملاً نشکند.
 */

function pickStore(): { store: RateLimitStore; reset: () => Promise<void> } {
  if (process.env.NODE_ENV === 'test') {
    const store = createMemoryStore()
    return { store, reset: async () => store.clear() }
  }

  if (process.env.RATE_LIMIT_STORE === 'redis') {
    // fail-open: اگر Redis پایین باشد به حافظهٔ درون-process برمی‌گردد
    const store = createResilientRedisStore(redis)
    return { store, reset: async () => store.clear() }
  }

  const store = createFileStore(DEFAULT_RATE_LIMIT_PATH)
  return { store, reset: async () => store.clear() }
}

const { store, reset } = pickStore()

/** هر چند عملیات یک‌بار سطل‌های منقضی پاک شوند */
const SWEEP_INTERVAL = 64
let operationCount = 0

function maybeSweep(now: number): Promise<void> {
  operationCount += 1
  if (operationCount % SWEEP_INTERVAL === 0) return store.sweep(now)
  return Promise.resolve()
}

/** سقف تلاش برای یک حساب، مستقل از اینکه از کجا می‌آید */
export const USERNAME_RATE_LIMIT = {
  maxAttempts: 30,
  windowMs: 60 * 60_000,
} as const

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
 * @param key شناسهٔ یکتا — معمولاً IP یا نام کاربری
 * @param maxAttempts سقف تلاش در پنجره
 * @param windowMs طول پنجره به میلی‌ثانیه
 */
export async function consumeRateLimit(
  key: string,
  maxAttempts: number,
  windowMs: number
): Promise<RateLimitResult> {
  const now = Date.now()
  await maybeSweep(now)

  const existing = await store.get(key)

  if (!existing || existing.resetAt <= now) {
    await store.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: maxAttempts - 1, retryAfterSeconds: 0 }
  }

  const next = { count: existing.count + 1, resetAt: existing.resetAt }
  await store.set(key, next)

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
export async function resetRateLimit(key: string): Promise<void> {
  await store.delete(key)
}

/** فقط برای تست — پاک‌کردن کامل وضعیت */
export async function __resetAllRateLimits(): Promise<void> {
  await reset()
}

/**
 * استخراج IP از هدرهای درخواست.
 *
 * پشت پراکسی (Vercel، Cloudflare، nginx) آدرس واقعی در هدر است.
 * اگر هیچ‌کدام نبود، یک کلید ثابت برمی‌گردانیم — یعنی همهٔ
 * درخواست‌های بدون IP یک سطل مشترک دارند.
 *
 * ══════════════════════════════════════════════════════════════
 *  هشدار: `x-forwarded-for` قابل جعل است
 * ══════════════════════════════════════════════════════════════
 * وقتی پراکسی هست، اولین عنصر لیست چیزی است که کلاینت ادعا کرده و
 * باز هم جعلی است؛ IP قابل اعتماد، عنصر nاُم از راست است که n
 * تعداد پراکسی‌های تحت کنترل شماست.
 *
 * پیکربندی:
 *   TRUSTED_PROXY_HOPS=1   → پشت یک پراکسی (nginx یا Cloudflare)
 *   TRUSTED_PROXY_HOPS=2   → Cloudflare + nginx
 *   (تعریف نشده)           → رفتار قبلی: اولین عنصر
 */
export function getClientKey(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for')

  if (forwarded) {
    const chain = forwarded
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean)

    if (chain.length > 0) {
      const hops = Number.parseInt(process.env.TRUSTED_PROXY_HOPS ?? '', 10)

      if (Number.isInteger(hops) && hops > 0) {
        // شمارش از راست: آخرین مقداری که پراکسی مورد اعتماد نوشته
        const index = chain.length - hops
        return chain[index >= 0 ? index : 0]!
      }

      return chain[0]!
    }
  }

  return headers.get('x-real-ip')?.trim() || 'unknown-client'
}

/**
 * کلید سطل بر اساس نام کاربری.
 *
 * نرمال‌سازی (حروف کوچک + حذف فاصله) لازم است وگرنه مهاجم با
 * `Admin`، `ADMIN` و ` admin ` سه سطل جدا می‌گیرد و سقف بی‌معنا
 * می‌شود — دقیقاً همان‌طور که `checkAdminCredentials` هم نام
 * کاربری را نرمال می‌کند.
 */
export function getUsernameKey(username: string): string {
  return `admin-login-user:${username.trim().toLowerCase()}`
}
