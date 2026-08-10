import 'server-only'
import { redis } from './redis'
import { logger } from './logger'

/**
 * Cache-aside pattern — helper برای caching داده‌ها در Redis
 *
 * الگو:
 * 1. بررسی cache — اگر hit، برگردان
 * 2. اگر miss، fetcher را صدا بزن
 * 3. نتیجه را در cache ذخیره کن با TTL
 * 4. برگردان
 */

interface CacheOptions {
  /** زمان انقضا به ثانیه */
  ttl: number
  /** پیشوند کلید — برای گروه‌بندی */
  prefix?: string
}

/**
 * Cache-aside — اگر در cache بود برگردان، وگرنه fetch کن و cache کن
 *
 * @param key - کلید cache
 * @param fetcher - تابع async برای fetch داده
 * @param options - تنظیمات cache
 */
export async function cacheAside<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions
): Promise<T> {
  // در محیط تست، cache را bypass کن
  if (process.env.NODE_ENV === 'test') {
    return fetcher()
  }

  const cacheKey = options.prefix ? `${options.prefix}:${key}` : key

  try {
    // 1. بررسی cache
    const cached = await redis.get(cacheKey)
    if (cached) {
      const data = JSON.parse(cached) as T
      logger.debug({ cacheKey }, 'Cache hit')
      return data
    }
  } catch (err) {
    // اگر Redis مشکل داشت، ادامه بده و مستقیم fetch کن
    logger.warn({ err, cacheKey }, 'Cache read failed, falling through to fetcher')
  }

  // 2. Fetch از منبع اصلی
  const data = await fetcher()

  // 3. ذخیره در cache
  try {
    await redis.set(cacheKey, JSON.stringify(data), 'EX', options.ttl)
    logger.debug({ cacheKey, ttl: options.ttl }, 'Cache set')
  } catch (err) {
    // اگر Redis مشکل داشت، فقط لاگ کن — داده را برگردان
    logger.warn({ err, cacheKey }, 'Cache write failed')
  }

  // 4. برگردان
  return data
}

/**
 * Invalidate cache — حذف امن و غیربلاک‌کننده کلیدها با استفاده از scanStream
 *
 * @param pattern - الگوی کلید (glob pattern) — مثلاً 'products:*'
 */
export async function cacheInvalidate(pattern: string): Promise<void> {
  // در محیط تست، cache را bypass کن
  if (process.env.NODE_ENV === 'test') {
    return
  }

  try {
    const keysToDelete: string[] = []
    const stream = redis.scanStream({
      match: pattern,
      count: 100,
    })

    await new Promise<void>((resolve, reject) => {
      stream.on('data', (resultKeys: string[]) => {
        for (const k of resultKeys) {
          keysToDelete.push(k)
        }
      })
      stream.on('end', () => resolve())
      stream.on('error', (err) => reject(err))
    })

    if (keysToDelete.length > 0) {
      const BATCH_SIZE = 500
      for (let i = 0; i < keysToDelete.length; i += BATCH_SIZE) {
        const batch = keysToDelete.slice(i, i + BATCH_SIZE)
        await redis.del(...batch)
      }
      logger.info({ pattern, count: keysToDelete.length }, 'Cache invalidated')
    }
  } catch (err) {
    logger.warn({ err, pattern }, 'Cache invalidation failed')
  }
}

/**
 * Invalidate cache با prefix — حذف همه کلیدهای با پیشوند مشخص
 */
export async function cacheInvalidateByPrefix(prefix: string): Promise<void> {
  return cacheInvalidate(`${prefix}:*`)
}
