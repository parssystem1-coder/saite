import 'server-only'

/**
 * fetch مقاوم با timeout — برای همه فراخوانی‌های خارجی سرور
 *
 * هر ۸ فراخوانی خارجی (zarinpal, idpay, anthropic, openai) باید از این helper
 * استفاده کنند تا درخواست معلق worker را قفل نکند.
 */

export interface FetchJsonOptions extends RequestInit {
  timeoutMs?: number
}

export async function fetchJson<T>(url: string, options: FetchJsonOptions = {}): Promise<T> {
  const { timeoutMs = 10_000, ...init } = options

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const res = await fetch(url, {
      ...init,
      signal: controller.signal,
    })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(`Fetch failed ${res.status} ${url}: ${text.slice(0, 200)}`)
    }

    return (await res.json()) as T
  } finally {
    clearTimeout(timeout)
  }
}
