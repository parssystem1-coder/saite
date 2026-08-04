import { describe, expect, it } from 'vitest'
import { NextRequest } from 'next/server'
import { config, proxy } from '@/proxy'
import {
  ADMIN_SESSION_COOKIE,
  createAdminSessionToken,
} from '@/lib/auth/server/session-token'

/**
 * گارد سمت سرور ناحیهٔ `/admin`.
 *
 * ══════════════════════════════════════════════════════════════
 *  چرا این فایل حیاتی است
 * ══════════════════════════════════════════════════════════════
 * در Next.js 16 قرارداد `middleware` منسوخ شده و به `proxy` تغییر
 * نام داده. حالت خطرناک این است که فایل با نام قدیمی بماند:
 * **هیچ خطایی داده نمی‌شود** و گارد بی‌صدا اجرا نمی‌شود، یعنی پنل
 * برای همه باز است.
 *
 * این تست‌ها مستقیم تابع را صدا می‌زنند، پس اگر روزی امضای تابع
 * یا matcher خراب شود، اینجا قرمز می‌شود — نه در production.
 */

function request(pathname: string, cookie?: string): NextRequest {
  const headers = new Headers()
  if (cookie) headers.set('cookie', `${ADMIN_SESSION_COOKIE}=${cookie}`)
  return new NextRequest(new URL(`http://localhost:3000${pathname}`), { headers })
}

describe('🔑 مسیرهای محافظت‌شده', () => {
  it('بازدیدکنندهٔ بدون نشست به صفحهٔ ورود می‌رود', async () => {
    const response = await proxy(request('/admin'))

    expect(response.status).toBe(307)
    const location = response.headers.get('location') ?? ''
    expect(location).toContain('/admin/login')
  })

  it('همهٔ زیرمسیرهای پنل محافظت می‌شوند', async () => {
    const paths = [
      '/admin',
      '/admin/orders',
      '/admin/products',
      '/admin/products/new',
      '/admin/settings',
      '/admin/users',
      '/admin/finance/invoices',
      '/admin/reports/sales',
      '/admin/communications/inquiries',
    ]

    for (const path of paths) {
      const response = await proxy(request(path))
      expect(response.headers.get('location') ?? '').toContain('/admin/login')
    }
  })

  it('مقصد اصلی برای بازگشت پس از ورود حفظ می‌شود', async () => {
    const response = await proxy(request('/admin/orders'))
    const location = new URL(response.headers.get('location') ?? '')

    expect(location.searchParams.get('redirect')).toBe('/admin/orders')
  })

  it('پاسخ ریدایرکت کش نمی‌شود', async () => {
    /*
      اگر کش می‌شد، کاربر واردشده هم ممکن بود همان ریدایرکت را
      از کش بگیرد و در حلقه بیفتد.
    */
    const response = await proxy(request('/admin'))
    expect(response.headers.get('cache-control')).toContain('no-store')
  })
})

describe('🔑 مقاومت در برابر کوکی جعلی', () => {
  it('کوکی با مقدار دلخواه رد می‌شود', async () => {
    const response = await proxy(request('/admin', 'true'))
    expect(response.headers.get('location') ?? '').toContain('/admin/login')
  })

  it('کوکی شبیه state قدیمی localStorage رد می‌شود', async () => {
    /*
      دقیقاً همان چیزی که در نسخهٔ قبلی کار می‌کرد:
      localStorage.setItem('admin-session', '{"state":{"isAdminAuthenticated":true}}')
    */
    const forged = encodeURIComponent('{"state":{"isAdminAuthenticated":true}}')
    const response = await proxy(request('/admin', forged))
    expect(response.headers.get('location') ?? '').toContain('/admin/login')
  })

  it('توکن با امضای دستکاری‌شده رد می‌شود', async () => {
    const valid = await createAdminSessionToken('admin-1')
    const [payload] = valid.split('.')

    const response = await proxy(request('/admin', `${payload}.forged-signature`))
    expect(response.headers.get('location') ?? '').toContain('/admin/login')
  })
})

describe('نشست معتبر', () => {
  it('🔑 مدیر با نشست درست عبور می‌کند', async () => {
    const token = await createAdminSessionToken('admin-1')
    const response = await proxy(request('/admin', token))

    // NextResponse.next() بدون ریدایرکت
    expect(response.headers.get('location')).toBeNull()
    expect(response.status).toBe(200)
  })

  it('نشست معتبر در زیرمسیرها هم کار می‌کند', async () => {
    const token = await createAdminSessionToken('admin-1')
    const response = await proxy(request('/admin/settings', token))

    expect(response.headers.get('location')).toBeNull()
  })

  it('توکن منقضی‌شده رد می‌شود', async () => {
    // توکنی که در گذشته منقضی شده
    const token = await createAdminSessionToken('admin-1', -10)
    const response = await proxy(request('/admin', token))

    expect(response.headers.get('location') ?? '').toContain('/admin/login')
  })
})

describe('مسیرهای عمومی داخل /admin', () => {
  it('🔑 صفحهٔ ورود بدون نشست باز می‌شود — وگرنه حلقهٔ ریدایرکت', async () => {
    const response = await proxy(request('/admin/login'))
    expect(response.headers.get('location')).toBeNull()
  })

  it('صفحهٔ بازیابی بدون نشست باز می‌شود', async () => {
    const response = await proxy(request('/admin/recover'))
    expect(response.headers.get('location')).toBeNull()
  })

  it('🔑 مسیری که فقط با /admin/login شروع شود محافظت می‌ماند', async () => {
    /*
      تلهٔ کلاسیک: اگر شرط `startsWith('/admin/login')` بدون بررسی
      مرز باشد، مسیر `/admin/loginhack` هم عمومی می‌شود.
    */
    const response = await proxy(request('/admin/loginhack'))
    expect(response.headers.get('location') ?? '').toContain('/admin/login')
  })
})

describe('پیکربندی matcher', () => {
  it('🔑 کل ناحیهٔ /admin را پوشش می‌دهد', () => {
    expect(config.matcher).toContain('/admin/:path*')
  })

  it('فقط ناحیهٔ ادمین را می‌گیرد — فروشگاه دست‌نخورده می‌ماند', () => {
    /*
      اگر matcher کل سایت را می‌گرفت، هر درخواست فروشگاه هم از
      این لایه رد می‌شد و بی‌دلیل کند می‌شد.
    */
    for (const pattern of config.matcher) {
      expect(pattern.startsWith('/admin')).toBe(true)
    }
  })
})
