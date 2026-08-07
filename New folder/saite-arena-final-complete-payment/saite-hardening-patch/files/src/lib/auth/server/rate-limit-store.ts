import 'server-only'

import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

/**
 * ذخیره‌سازی پایدار شمارندهٔ محدودیت نرخ.
 *
 * ══════════════════════════════════════════════════════════════
 *  مشکلی که حل می‌شود
 * ══════════════════════════════════════════════════════════════
 * نسخهٔ اول فقط `Map` در حافظهٔ process بود. یعنی:
 *
 *   مهاجم ۱۰ بار تلاش می‌کند → قفل می‌شود
 *   سرور ری‌استارت می‌شود (deploy، crash، nodemon)
 *   → شمارنده صفر · قفل از بین می‌رود
 *
 * ══════════════════════════════════════════════════════════════
 *  🆕 چرا مسیر پیش‌فرض از `.next/cache` بیرون آمد
 * ══════════════════════════════════════════════════════════════
 * نسخهٔ قبلی فایل را در `.next/cache/` می‌گذاشت با این استدلال که
 * «gitignore شده و معمولاً نوشتنی است». هر دو درست بود، اما یک
 * چیز از قلم افتاده بود:
 *
 *   `.next/` با **هر بیلد از نو ساخته می‌شود.**
 *
 * یعنی همان مشکلی که این ماژول قرار بود حل کند، هنوز پابرجا بود —
 * فقط جای «ری‌استارت» را «deploy» گرفته بود. مهاجم کافی بود منتظر
 * انتشار بعدی بماند. راهنمای خود Next هم می‌گوید `.next` را
 * artifact بیلد بدانید، نه محل دادهٔ ماندگار.
 *
 * حالا پیش‌فرض `.data/` در ریشهٔ پروژه است: بیرون از چرخهٔ بیلد،
 * ولی هنوز داخل دایرکتوری کاری.
 *
 * ⚠️ **`.data/` را به `.gitignore` اضافه کنید** — این فایل شامل
 *    IP کاربران است و نباید کامیت شود.
 *
 * روی هاست‌هایی که فایل‌سیستم فقط-خواندنی دارند (Vercel و مشابه)
 * با `RATE_LIMIT_STORE_PATH` مسیر یک volume نوشتنی را بدهید، یا
 * اگر ندارید، ماژول بی‌صدا به حالت حافظه‌ای برمی‌گردد.
 *
 * ── چرا فایل و نه Redis؟ ──────────────────────────────────────
 * Redis یک سرویس جداگانه است که باید نصب، پیکربندی و نگهداری
 * شود. برای فروشگاهی که روی یک سرور اجرا می‌شود و یک مدیر دارد،
 * این هزینهٔ عملیاتی توجیه ندارد.
 *
 * ── چرا نوشتن اتمیک؟ ──────────────────────────────────────────
 * اگر وسط نوشتن برق برود یا process کشته شود، فایل نیمه‌نوشته
 * می‌ماند و دفعهٔ بعد JSON خراب است. با نوشتن در فایل موقت و
 * `rename` (که در سطح سیستم‌فایل اتمیک است) این حالت ممکن نیست.
 *
 * ── محدودیت صادقانه ───────────────────────────────────────────
 * روی چند instance هم‌زمان (serverless، چند container) هنوز
 * مشترک نیست. اگر به آن رسیدید، `createFileStore` را با یک
 * پیاده‌سازی Redis عوض کنید — رابط `RateLimitStore` ثابت می‌ماند.
 */

export interface Bucket {
  count: number
  resetAt: number
}

export interface RateLimitStore {
  get(key: string): Bucket | undefined
  set(key: string, bucket: Bucket): void
  delete(key: string): void
  clear(): void
  /** حذف سطل‌های منقضی — تا فایل بی‌نهایت رشد نکند */
  sweep(now: number): void
}

/** حافظه‌ای محض — برای تست و محیط‌هایی که دیسک نوشتنی نیست */
export function createMemoryStore(): RateLimitStore {
  const buckets = new Map<string, Bucket>()

  return {
    get: (key) => buckets.get(key),
    set: (key, bucket) => void buckets.set(key, bucket),
    delete: (key) => void buckets.delete(key),
    clear: () => buckets.clear(),
    sweep: (now) => {
      for (const [key, bucket] of buckets) {
        if (bucket.resetAt <= now) buckets.delete(key)
      }
    },
  }
}

/**
 * فایل‌محور با کش در حافظه.
 *
 * خواندن از حافظه است (سریع)، نوشتن روی دیسک (پایدار). فایل فقط
 * وقتی نوشته می‌شود که چیزی عوض شده باشد.
 */
export function createFileStore(filePath: string): RateLimitStore {
  const buckets = new Map<string, Bucket>()
  let loaded = false
  /** اگر دیسک نوشتنی نبود، بی‌صدا به حافظه برمی‌گردیم */
  let writable = true

  function load(): void {
    if (loaded) return
    loaded = true

    try {
      const raw = readFileSync(filePath, 'utf8')
      const parsed: unknown = JSON.parse(raw)

      if (parsed && typeof parsed === 'object') {
        const now = Date.now()
        for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
          if (
            value &&
            typeof value === 'object' &&
            typeof (value as Bucket).count === 'number' &&
            typeof (value as Bucket).resetAt === 'number' &&
            (value as Bucket).resetAt > now
          ) {
            buckets.set(key, value as Bucket)
          }
        }
      }
    } catch {
      /*
        فایل نبود یا خراب بود — هر دو حالت طبیعی‌اند:
        اولین اجرا، یا خرابی پس از قطع برق. با نقشهٔ خالی
        شروع می‌کنیم؛ بدترین حالت این است که شمارنده صفر شود،
        که همان رفتار قبلی است.
      */
    }
  }

  function persist(): void {
    if (!writable) return

    try {
      // 0o700: فقط کاربر اجراکننده. این پوشه IP کاربران را دارد.
      mkdirSync(dirname(filePath), { recursive: true, mode: 0o700 })

      const snapshot: Record<string, Bucket> = {}
      for (const [key, bucket] of buckets) snapshot[key] = bucket

      // نوشتن اتمیک: فایل موقت، سپس rename
      const tempPath = `${filePath}.${process.pid}.tmp`
      writeFileSync(tempPath, JSON.stringify(snapshot), { encoding: 'utf8', mode: 0o600 })
      renameSync(tempPath, filePath)
    } catch {
      /*
        دیسک فقط-خواندنی (بعضی محیط‌های serverless) یا بدون
        دسترسی. محدودیت نرخ نباید ورود را کاملاً بشکند، پس به
        حالت حافظه‌ای برمی‌گردیم و دیگر تلاش نمی‌کنیم.
      */
      writable = false
    }
  }

  return {
    get(key) {
      load()
      return buckets.get(key)
    },
    set(key, bucket) {
      load()
      buckets.set(key, bucket)
      persist()
    },
    delete(key) {
      load()
      buckets.delete(key)
      persist()
    },
    clear() {
      loaded = true
      buckets.clear()
      persist()
    },
    sweep(now) {
      load()
      let changed = false
      for (const [key, bucket] of buckets) {
        if (bucket.resetAt <= now) {
          buckets.delete(key)
          changed = true
        }
      }
      if (changed) persist()
    },
  }
}

/**
 * مسیر پیش‌فرض فایل.
 *
 * ترتیب اولویت:
 *   ۱. `RATE_LIMIT_STORE_PATH` — برای هاست‌هایی با volume جداگانه
 *   ۲. `<cwd>/.data/saite-rate-limit.json`
 *
 * چرا `.data` و نه `.next/cache`؟ چون `.next` با هر بیلد پاک
 * می‌شود و قفل‌ها را آزاد می‌کند. جزئیات در بالای همین فایل.
 */
export function resolveRateLimitPath(): string {
  const fromEnv = process.env.RATE_LIMIT_STORE_PATH?.trim()
  if (fromEnv) return fromEnv
  return join(process.cwd(), '.data', 'saite-rate-limit.json')
}

export const DEFAULT_RATE_LIMIT_PATH = resolveRateLimitPath()
