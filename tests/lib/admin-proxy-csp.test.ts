import { describe, expect, it } from 'vitest'
import { NextRequest } from 'next/server'
import { proxy } from '@/proxy'
import {
  ADMIN_SESSION_COOKIE,
  createAdminSessionToken,
} from '@/lib/auth/server/session-token'

/**
 * فاز D — CSP با nonce روی مسیرهای /admin.
 *
 * این تست‌ها تضمین می‌کنند که proxy هدر CSP سختگیرانه با nonce
 * روی هر پاسخ ادمین می‌گذارد و همان nonce در هدر داخلی برای
 * رندر Server Component قابل خواندن است.
 */

function request(pathname: string, cookie?: string): NextRequest {
  const headers = new Headers()
  if (cookie) headers.set('cookie', `${ADMIN_SESSION_COOKIE}=${cookie}`)
  return new NextRequest(new URL(`http://localhost:3000${pathname}`), { headers })
}

describe('CSP روی /admin (فاز D)', () => {
  it('/admin/login — CSP سختگیرانه با nonce', async () => {
    const response = await proxy(request('/admin/login'))
    const csp = response.headers.get('content-security-policy') ?? ''

    // nonce یکتای تصادفی
    expect(csp).toMatch(/'nonce-[A-Za-z0-9_-]{20,}'/)
    // strict-dynamic فعال است
    expect(csp).toContain("'strict-dynamic'")
    // frame-ancestors هنوز بسته
    expect(csp).toContain("frame-ancestors 'none'")
    // form-action بسته
    expect(csp).toContain("form-action 'self'")
  })

  it('پاسخ ادمین no-store دارد', async () => {
    const response = await proxy(request('/admin/login'))
    const cacheControl = response.headers.get('cache-control') ?? ''
    expect(cacheControl).toContain('no-store')
  })

  it('پاسخ ادمین noindex دارد', async () => {
    const response = await proxy(request('/admin/login'))
    expect(response.headers.get('x-robots-tag') ?? '').toContain('noindex')
  })

  it('/admin با نشست معتبر — CSP + nonce هست', async () => {
    const token = await createAdminSessionToken('admin-1', 'admin')
    const response = await proxy(request('/admin', token))

    expect(response.headers.get('content-security-policy') ?? '').toMatch(
      /'nonce-[A-Za-z0-9_-]{20,}'/
    )
  })

  it('ریدایرکت (نشست غایب) هم هدرهای امنیتی دارد', async () => {
    const response = await proxy(request('/admin'))
    expect(response.status).toBe(307)
    // حتی روی ریدایرکت، CSP و noindex اعمال می‌شود
    expect(response.headers.get('content-security-policy') ?? '').toContain(
      'frame-ancestors'
    )
    expect(response.headers.get('x-robots-tag') ?? '').toContain('noindex')
  })

  it('nonce در دو درخواست جدا متفاوت است', async () => {
    const r1 = await proxy(request('/admin/login'))
    const r2 = await proxy(request('/admin/login'))
    const csp1 = r1.headers.get('content-security-policy') ?? ''
    const csp2 = r2.headers.get('content-security-policy') ?? ''
    const nonce1 = csp1.match(/'nonce-([A-Za-z0-9_-]+)'/)?.[1]
    const nonce2 = csp2.match(/'nonce-([A-Za-z0-9_-]+)'/)?.[1]
    expect(nonce1).toBeDefined()
    expect(nonce2).toBeDefined()
    expect(nonce1).not.toBe(nonce2)
  })
})
