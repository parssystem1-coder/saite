import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/auth/server/admin-session', async () => {
  const actual = await vi.importActual<typeof import('@/lib/auth/server/admin-session')>(
    '@/lib/auth/server/admin-session'
  )
  return { ...actual, getAdminSession: vi.fn() }
})

vi.mock('@/lib/auth/server/rate-limit', () => ({
  consumeRateLimit: vi.fn(),
  getClientKey: vi.fn().mockReturnValue('127.0.0.1'),
}))

import { getAdminSession } from '@/lib/auth/server/admin-session'
import { consumeRateLimit } from '@/lib/auth/server/rate-limit'
import { POST } from '@/app/api/admin/products/seo/import/route'
import { PRODUCT_SEO_FILE_TYPE, PRODUCT_SEO_IMPORT_MAX_CHARS } from '@/lib/seo/product-seo-pack'
import type { AdminRole, AdminUser } from '@/types/user'

const mockedSession = vi.mocked(getAdminSession)
const mockedLimit = vi.mocked(consumeRateLimit)

function admin(role: AdminRole): AdminUser {
  return { id: 'admin-1', name: 'مدیر', email: 'admin@saite.local', role }
}

function request(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/admin/products/seo/import', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const suggestion = {
  seoTitle: 'پرینتر اچ پی M402 | خرید و قیمت روز',
  seoDescription:
    'خرید پرینتر اچ پی M402 با گارانتی اصالت کالا و مشاوره تخصصی در فروشگاه ماشین‌های اداری سایت. مشخصات فنی و قیمت به‌روز.',
  focusKeyword: 'پرینتر اچ پی M402',
}

const payload = {
  emptyOnly: true,
  rawText: JSON.stringify({
    fileType: PRODUCT_SEO_FILE_TYPE,
    schemaVersion: 1,
    suggestion,
  }),
  current: {
    name: '',
    nameEn: '',
    slug: '',
    sku: '',
    series: '',
    model: '',
    category: '',
    subCategory: '',
    brand: '',
    shortDescription: '',
    longDescription: '',
    seoTitle: '',
    seoDescription: '',
    focusKeyword: '',
    canonicalUrl: '',
    faqs: [],
    attributes: [],
    imageAlts: [],
  },
  faqs: [],
}

describe('POST /api/admin/products/seo/import', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedLimit.mockResolvedValue({ allowed: true, remaining: 9, retryAfterSeconds: 0 })
  })

  it('بدون نشست → ۴۰۱', async () => {
    mockedSession.mockResolvedValue(null)
    const res = await POST(request(payload))
    expect(res.status).toBe(401)
  })

  it('viewer → ۴۰۳', async () => {
    mockedSession.mockResolvedValue(admin('viewer'))
    const res = await POST(request(payload))
    expect(res.status).toBe(403)
  })

  it('rate-limit → ۴۲۹', async () => {
    mockedSession.mockResolvedValue(admin('operator'))
    mockedLimit.mockResolvedValueOnce({ allowed: false, remaining: 0, retryAfterSeconds: 30 })
    const res = await POST(request(payload))
    expect(res.status).toBe(429)
    expect(res.headers.get('Retry-After')).toBe('30')
  })

  it('operator با فایل سالم → پیشنهاد برای diff و بدون نوشتن', async () => {
    mockedSession.mockResolvedValue(admin('operator'))
    const res = await POST(request(payload))
    expect(res.status).toBe(200)
    const body = (await res.json()) as {
      suggestion: { seoTitle?: string }
      promptVersion: string
      source: string
    }
    expect(body.suggestion.seoTitle).toContain('پرینتر')
    expect(body.promptVersion).toBe('import:v1')
    expect(body.source).toBe('file')
  })

  it('فایل کامل هویت و مشخصات را برای diff برمی‌گرداند', async () => {
    mockedSession.mockResolvedValue(admin('operator'))
    const res = await POST(
      request({
        ...payload,
        emptyOnly: false,
        rawText: JSON.stringify({
          fileType: PRODUCT_SEO_FILE_TYPE,
          schemaVersion: 1,
          suggestion: {
            ...suggestion,
            name: 'پرینتر اچ پی M402',
            sku: 'HP-M402',
            attributes: [{ group: 'عملکرد', name: 'سرعت چاپ', value: '38', unit: 'ppm' }],
            imageAlts: ['پرینتر اچ پی M402 نمای جلو'],
          },
        }),
      })
    )
    expect(res.status).toBe(200)
    const body = (await res.json()) as {
      suggestion: { name?: string; sku?: string; attributes?: unknown[]; imageAlts?: string[] }
    }
    expect(body.suggestion.name).toBe('پرینتر اچ پی M402')
    expect(body.suggestion.sku).toBe('HP-M402')
    expect(body.suggestion.attributes).toHaveLength(1)
    expect(body.suggestion.imageAlts).toEqual(['پرینتر اچ پی M402 نمای جلو'])
  })

  it('فایل بدون schemaVersion → ۴۰۰', async () => {
    mockedSession.mockResolvedValue(admin('admin'))
    const res = await POST(
      request({
        ...payload,
        rawText: JSON.stringify({ fileType: PRODUCT_SEO_FILE_TYPE, suggestion }),
      })
    )
    expect(res.status).toBe(400)
    const body = (await res.json()) as { error: string }
    expect(body.error).toMatch(/schemaVersion/)
  })

  it('حجم بیش از سقف → ۴۰۰', async () => {
    mockedSession.mockResolvedValue(admin('admin'))
    const res = await POST(
      request({
        ...payload,
        rawText: 'x'.repeat(PRODUCT_SEO_IMPORT_MAX_CHARS + 8),
      })
    )
    expect(res.status).toBe(400)
    const body = (await res.json()) as { error: string }
    expect(body.error).toMatch(/۶۴ کیلوبایت/)
  })
})
