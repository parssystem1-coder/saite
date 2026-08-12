import 'server-only'

/**
 * fetch مقاوم با timeout و retry — برای همهٔ فراخوانی‌های خارجی سرور
 *
 * هر فراخوانی خارجی (zarinpal, idpay, anthropic, openai) باید از این helper
 * استفاده کند تا درخواست معلق worker را قفل نکند.
 *
 * - timeoutMs: سقف زمان هر تلاش (پیش‌فرض ۱۰ ثانیه)
 * - retries: تعداد تلاش مجدد پس از خطای شبکه یا پاسخ غیر-OK (با backoff)
 * - خطاهای 4xx/5xx به HttpError تبدیل می‌شوند تا caller بتواند status را بخواند
 */

export class HttpError extends Error {
  readonly status: number
  readonly url: string
  readonly responseText: string

  constructor(status: number, url: string, responseText: string) {
    super(`Fetch failed ${status} ${url}: ${responseText.slice(0, 200)}`)
    this.name = 'HttpError'
    this.status = status
    this.url = url
    this.responseText = responseText
  }
}

export interface FetchJsonOptions extends RequestInit {
  timeoutMs?: number
  retries?: number
  initialDelayMs?: number
  maxDelayMs?: number
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

export async function fetchJson<T>(url: string, options: FetchJsonOptions = {}): Promise<T> {
  const {
    timeoutMs = 10_000,
    retries = 0,
    initialDelayMs = 500,
    maxDelayMs = 10_000,
    ...init
  } = options

  let lastError: Error | null = null

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), timeoutMs)

    try {
      const res = await fetch(url, {
        ...init,
        signal: controller.signal,
      })

      const text = await res.text().catch(() => '')
      if (!res.ok) {
        throw new HttpError(res.status, url, text)
      }

      if (!text) return undefined as T
      try {
        return JSON.parse(text) as T
      } catch {
        // پاسخ غیر-JSON (نادر) — به‌عنوان متن برگردان
        return text as unknown as T
      }
    } catch (err) {
      // abort به دلیل timeout — retry معنا ندارد، خطای نهایی است
      if (err instanceof DOMException && err.name === 'AbortError') {
        throw new Error(`Fetch timeout after ${timeoutMs}ms: ${url}`)
      }

      lastError = err instanceof Error ? err : new Error(String(err))

      if (attempt === retries) break

      const delay = Math.min(initialDelayMs * Math.pow(2, attempt), maxDelayMs)
      await sleep(delay)
    } finally {
      clearTimeout(timeout)
    }
  }

  throw lastError || new Error(`Fetch failed: ${url}`)
}
