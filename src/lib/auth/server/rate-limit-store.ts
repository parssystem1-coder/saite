import 'server-only'

import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import type { Redis } from 'ioredis'

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
 * فایل‌محور، بعد از ری‌استارت پایدار است ولی روی چند instance
 * (چند container) مشترک نیست. `createRedisStore` برای آن حالت است.
 *
 * ── چرا Redis و نه فایل؟ ─────────────────────────────────────
 * وقتی `app` در چند instance اجرا می‌شود، هر instance سطل IP/username
 * خودش را دارد → سقف login مؤثراً × تعداد instance. Redis یک منبع
 * مشترک است؛ شمارنده‌ها بین همهٔ instance ها یکی‌اند.
 *
 * ── چرا پیش‌فرض Redis نیست؟ ──────────────────────────────────
 * در dev و تست معمولاً Redis در دسترس نیست و برای یک instance
 * فایل کافی است. با `RATE_LIMIT_STORE=redis` روشن می‌شود.
 */

export interface Bucket {
  count: number
  resetAt: number
}

export interface RateLimitStore {
  get(key: string): Promise<Bucket | undefined>
  set(key: string, bucket: Bucket): Promise<void>
  delete(key: string): Promise<void>
  clear(): Promise<void>
  /** حذف سطل‌های منقضی — تا فایل بی‌نهایت رشد نکند */
  sweep(now: number): Promise<void>
}

/** حافظه‌ای محض — برای تست و محیط‌هایی که دیسک نوشتنی نیست */
export function createMemoryStore(): RateLimitStore {
  const buckets = new Map<string, Bucket>()

  return {
    get: async (key) => buckets.get(key),
    set: async (key, bucket) => void buckets.set(key, bucket),
    delete: async (key) => void buckets.delete(key),
    clear: async () => buckets.clear(),
    sweep: async (now) => {
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
      /* فایل نبود یا خراب بود — هر دو حالت طبیعی‌اند */
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
      writable = false
    }
  }

  return {
    async get(key) {
      load()
      return buckets.get(key)
    },
    async set(key, bucket) {
      load()
      buckets.set(key, bucket)
      persist()
    },
    async delete(key) {
      load()
      buckets.delete(key)
      persist()
    },
    async clear() {
      loaded = true
      buckets.clear()
      persist()
    },
    async sweep(now) {
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

const KEY_PREFIX = 'rl:'

function encode(bucket: Bucket): string {
  return JSON.stringify(bucket)
}

function decode(raw: string | null | undefined): Bucket | undefined {
  if (!raw) return undefined
  try {
    const parsed = JSON.parse(raw) as Bucket
    if (typeof parsed.count === 'number' && typeof parsed.resetAt === 'number') {
      return parsed
    }
  } catch {
    /* ignore */
  }
  return undefined
}

/**
 * Redis-backed store — برای چند instance مشترک.
 *
 * - `set` با `SETEX` مقدار را با TTL متناظر expiresAt ذخیره می‌کند.
 * - `get`/`delete` مستقیم روی Redis.
 */
export function createRedisStore(redis: Redis): RateLimitStore {
  return {
    async get(key) {
      const raw = await redis.get(`${KEY_PREFIX}${key}`)
      return decode(raw)
    },
    async set(key, bucket) {
      const ttl = Math.max(1, Math.ceil((bucket.resetAt - Date.now()) / 1000))
      await redis.set(`${KEY_PREFIX}${key}`, encode(bucket), 'EX', ttl)
    },
    async delete(key) {
      await redis.del(`${KEY_PREFIX}${key}`)
    },
    async clear() {
      // حذف همهٔ کلیدهای rl:* با scan — در عمل clear فقط در تست/مقامی نادر است
      let cursor = '0'
      do {
        const [next, keys] = await redis.scan(cursor, 'MATCH', `${KEY_PREFIX}*`, 'COUNT', 100)
        cursor = next
        if (keys.length > 0) await redis.del(...keys)
      } while (cursor !== '0')
    },
    async sweep() {
      // TTL خودکار Redis سطل‌های منقضی را پاک می‌کند — نیازی به sweep نیست
    },
  }
}

/**
 * Redis با fallback fail-open.
 *
 * چون ioredis lazyConnect است، خطای اتصال هنگام عملیات رخ می‌دهد نه
 * ساخت. این wrapper هر عملیات Redis را try/catch می‌کند و در صورت
 * خطا (Redis پایین/قطع) به یک store حافظه‌ای درون-process برمی‌گردد
 * تا محدودیت نرخ، ورود را کاملاً نشکند. وقتی Redis دوباره بالا
 * بیاید، عملیات بعدی به Redis برمی‌گردد.
 */
export function createResilientRedisStore(redis: Redis): RateLimitStore {
  const redisStore = createRedisStore(redis)
  const memoryFallback = createMemoryStore()

  return {
    async get(key) {
      try {
        return await redisStore.get(key)
      } catch {
        return memoryFallback.get(key)
      }
    },
    async set(key, bucket) {
      try {
        await redisStore.set(key, bucket)
      } catch {
        await memoryFallback.set(key, bucket)
      }
    },
    async delete(key) {
      try {
        await redisStore.delete(key)
      } catch {
        await memoryFallback.delete(key)
      }
    },
    async clear() {
      try {
        await redisStore.clear()
      } catch {
        await memoryFallback.clear()
      }
    },
    async sweep(now) {
      try {
        await redisStore.sweep(now)
      } catch {
        await memoryFallback.sweep(now)
      }
    },
  }
}

/**
 * مسیر پیش‌فرض فایل.
 *
 * ترتیب اولویت:
 *   ۱. `RATE_LIMIT_STORE_PATH` — برای هاست‌هایی با volume جداگانه
 *   ۲. `<cwd>/.data/saite-rate-limit.json`
 */
export function resolveRateLimitPath(): string {
  const fromEnv = process.env.RATE_LIMIT_STORE_PATH?.trim()
  if (fromEnv) return fromEnv
  return join(process.cwd(), '.data', 'saite-rate-limit.json')
}

export const DEFAULT_RATE_LIMIT_PATH = resolveRateLimitPath()
