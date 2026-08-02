import { ApiError } from '@/lib/api-types'

/**
 * کلاینت HTTP برای فاز بک‌اند.
 *
 * الان اگر USE_MOCK=false باشد و endpoint واقعی نباشد، با ApiError واضح
 * شکست می‌خورد تا اشتباهی به production وصل نشویم.
 *
 * آماده‌سازی فاز بعد:
 *   return httpJson<ProductListResult>(`/api/products?${params}`)
 */

const DEFAULT_BASE =
  typeof process !== 'undefined' ? (process.env.NEXT_PUBLIC_API_BASE_URL ?? '') : ''

export function isMockMode(): boolean {
  // پیش‌فرض: mock. فقط با NEXT_PUBLIC_USE_MOCK=false سراغ HTTP می‌رویم.
  return process.env.NEXT_PUBLIC_USE_MOCK !== 'false'
}

export async function httpJson<T>(path: string, init?: RequestInit): Promise<T> {
  const base = DEFAULT_BASE.replace(/\/$/, '')
  const url = path.startsWith('http') ? path : `${base}${path.startsWith('/') ? path : `/${path}`}`

  if (!base && !path.startsWith('http')) {
    throw new ApiError(
      503,
      'API base URL تنظیم نشده است. NEXT_PUBLIC_API_BASE_URL را تعریف کنید یا mock را فعال بگذارید.',
      'API_NOT_CONFIGURED'
    )
  }

  let res: Response
  try {
    res = await fetch(url, {
      ...init,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...init?.headers,
      },
    })
  } catch {
    throw new ApiError(0, 'ارتباط با سرور برقرار نشد.', 'NETWORK_ERROR')
  }

  if (!res.ok) {
    let message = res.statusText || 'خطای سرور'
    try {
      const body = (await res.json()) as { message?: string }
      if (body.message) message = body.message
    } catch {
      /* ignore */
    }
    throw new ApiError(res.status, message, 'HTTP_ERROR')
  }

  return res.json() as Promise<T>
}
