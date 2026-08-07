import 'server-only'

import {
  createFileStore,
  createMemoryStore,
  DEFAULT_RATE_LIMIT_PATH,
  type RateLimitStore,
} from '@/lib/auth/server/rate-limit-store'

/**
 * محدودیت نرخ ورود — سمت سرور.
 *
 * ── تفاوت با `useLoginThrottle` ───────────────────────────────
 * آن hook در حافظهٔ کامپوننت است: با رفرش صفحه پاک می‌شود و با
 * curl اصلاً وجود ندارد. فقط تجربهٔ کاربر را بهتر می‌کند.
 *
 * این ماژول واقعاً محدود می‌کند، چون مهاجم به وضعیت سرور دسترسی
 * ندارد.
 *
 * ══════════════════════════════════════════════════════════════
 *  🆕 چرا فقط محدودیت بر اساس IP کافی نبود
 * ══════════════════════════════════════════════════════════════
 * سقف ۱۰ تلاش در ۱۵ دقیقه **به ازای هر IP** است. مهاجمی که یک
 * botnet یا حتی یک لیست پروکسی ارزان دارد، از هزار IP هزار بار
 * تلاش می‌کند و هیچ‌کدام به سقف نمی‌خورند. حساب مدیر یکی است، اما
 * سطل‌ها هزارتا.
 *
 * حالا دو سطل موازی داریم:
 *
 *   sail per-IP        →  ۱۰ تلاش / ۱۵ دقیقه   (جلوی یک مهاجم)
 *   sail per-username  →  ۳۰ تلاش / ۱ ساعت     (جلوی حملهٔ توزیع‌شده)
 *
 * سطل نام کاربری سخاوتمندانه‌تر است چون یک مدیر واقعی که رمزش را
 * فراموش کرده نباید با ۱۰ تلاش برای یک ساعت قفل شود. عدد طوری
 * انتخاب شده که برای انسان بی‌آزار و برای اسکریپت کشنده باشد.
 *
 * ⚠️ اثر جانبی پذیرفته‌شده: مهاجم می‌تواند با ۳۰ تلاش عمدی، مدیر
 *    واقعی را یک ساعت قفل کند (denial of service روی حساب). این
 *    را آگاهانه پذیرفته‌ایم چون بدیلش — نداشتن سقف — بدتر است.
 *    راه فرار مدیر: مسیر `/admin/recover`.
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
 *
 * ══════════════════════════════════════════════════════════════
 *  🆕 هشدار: `x-forwarded-for` قابل جعل است
 * ══════════════════════════════════════════════════════════════
 * هر کسی می‌تواند این هدر را در درخواستش بگذارد. اگر برنامه
 * مستقیم روی اینترنت باشد (بدون پراکسی)، مهاجم با عوض کردن یک
 * هدر، هر بار سطل جدید می‌گیرد و محدودیت نرخ عملاً بی‌اثر است.
 *
 * وقتی پراکسی هست، **اولین** عنصر لیست همان چیزی است که کلاینت
 * ادعا کرده و باز هم جعلی است؛ IP قابل اعتماد، عنصر nاُم از
 * **راست** است که n تعداد پراکسی‌های تحت کنترل شماست.
 *
 * پیکربندی:
 *   TRUSTED_PROXY_HOPS=1   → پشت یک پراکسی (nginx یا Cloudflare)
 *   TRUSTED_PROXY_HOPS=2   → Cloudflare + nginx
 *   (تعریف نشده)           → رفتار قبلی: اولین عنصر
 *
 * پیش‌فرض عمداً عوض نشد تا استقرارهای فعلی نشکنند، اما اگر پشت
 * پراکسی هستید حتماً تنظیمش کنید.
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
