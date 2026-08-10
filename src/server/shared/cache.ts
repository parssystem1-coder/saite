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
 * Invalidate cache — حذف یک کلید یا گروهی از کلیدها
 *
 * @param pattern - الگوی کلید (glob pattern) — مثلاً 'products:*'
 */
export async function cacheInvalidate(pattern: string): Promise<void> {
  // در محیط تست، cache را bypass کن
  if (process.env.NODE_ENV === 'test') {
    return
  }

  try {
    const keys = await redis.keys(pattern)
    if (keys.length > 0) {
      await redis.del(...keys)
      logger.info({ pattern, count: keys.length }, 'Cache invalidated')
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
