/**
 * Retry Logic برای مقابله با موقت‌ترین خطاهای API
 * هنگامی که API Degraded است
 */

export interface RetryOptions {
  maxRetries?: number
  initialDelayMs?: number
  maxDelayMs?: number
  backoffMultiplier?: number
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelayMs: 500,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
}

/**
 * Exponential Backoff Retry
 * مثال:
 *   await retryAsync(() => fetch(...), { maxRetries: 3 })
 */
export async function retryAsync<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const config = { ...DEFAULT_OPTIONS, ...options }
  let lastError: Error | null = null

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      // اگر آخرین تلاش بود، خطا را throw کنید
      if (attempt === config.maxRetries) {
        break
      }

      // محاسبهٔ delay برای تلاش بعدی
      const delay = Math.min(
        config.initialDelayMs * Math.pow(config.backoffMultiplier, attempt),
        config.maxDelayMs
      )

      console.warn(
        `[Retry] تلاش ${attempt + 1} ناموفق. تلاش دوبارہ در ${delay}ms...`,
        lastError.message
      )

      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw lastError || new Error('Retry failed')
}
