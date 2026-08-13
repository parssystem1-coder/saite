import { describe, expect, it } from 'vitest'
import {
  buildAdminHeaders,
  buildContentSecurityPolicy,
  buildSecurityHeaders,
} from '@/lib/security-headers'

/**
 * هدرهای امنیتی.
 *
 * ── چرا این تست‌ها لازم‌اند ───────────────────────────────────
 * هدرها در `next.config.ts` تعریف می‌شوند که هیچ تستی نمی‌بیندش.
 * بدون این فایل، حذف تصادفی `frame-ancestors` هیچ‌جا قرمز
 * نمی‌شود و ماه‌ها بعد به‌صورت clickjacking کشف می‌شود.
 */

function headerValue(headers: { key: string; value: string }[], key: string) {
  return headers.find((header) => header.key === key)?.value
}

describe('Content-Security-Policy', () => {
  it('🔑 iframe کردن سایت را ممنوع می‌کند', () => {
    expect(buildContentSecurityPolicy(false)).toContain("frame-ancestors 'none'")
  })

  it('🔑 ارسال فرم به دامنهٔ بیگانه را می‌بندد', () => {
    // بدون این، XSS می‌تواند فرم ورود را به سرور مهاجم post کند
    expect(buildContentSecurityPolicy(false)).toContain("form-action 'self'")
  })

  it('🔑 تزریق <base> را می‌بندد', () => {
    expect(buildContentSecurityPolicy(false)).toContain("base-uri 'self'")
  })

  it('object-src بسته است', () => {
    expect(buildContentSecurityPolicy(false)).toContain("object-src 'none'")
  })

  it('در production از eval استفاده نمی‌شود', () => {
    // unsafe-eval فقط برای Fast Refresh در توسعه لازم است
    expect(buildContentSecurityPolicy(false)).not.toContain("'unsafe-eval'")
  })

  it('در توسعه eval و websocket مجازند', () => {
    const dev = buildContentSecurityPolicy(true)
    expect(dev).toContain("'unsafe-eval'")
    expect(dev).toContain('ws:')
  })

  it('upgrade-insecure-requests فقط در production', () => {
    expect(buildContentSecurityPolicy(false)).toContain('upgrade-insecure-requests')
    // در localhost روی http این دستور همه‌چیز را می‌شکند
    expect(buildContentSecurityPolicy(true)).not.toContain('upgrade-insecure-requests')
  })

  it('میزبان تصاویر remote مجاز است', () => {
    // وگرنه next/image با unsplash بی‌صدا خالی می‌ماند
    expect(buildContentSecurityPolicy(false)).toContain('https://images.unsplash.com')
  })

  it('بدون allowAnalytics میزبان GA4 در CSP عمومی نیست', () => {
    const csp = buildContentSecurityPolicy(false)
    expect(csp).not.toContain('https://www.googletagmanager.com')
  })

  it('با allowAnalytics میزبان رسمی GA4/GTM در script/connect هست و frame-src همچنان none است', () => {
    const csp = buildContentSecurityPolicy(false, undefined, { allowAnalytics: true })
    expect(csp).toContain('https://www.googletagmanager.com')
    expect(csp).toContain('https://www.google-analytics.com')
    expect(csp).toContain("frame-src 'none'")
    expect(csp).not.toContain('ns.html')
  })
})

describe('هدرهای عمومی', () => {
  it('nosniff فعال است', () => {
    expect(headerValue(buildSecurityHeaders(false), 'X-Content-Type-Options')).toBe('nosniff')
  })

  it('X-Frame-Options به‌عنوان پشتیبان CSP', () => {
    expect(headerValue(buildSecurityHeaders(false), 'X-Frame-Options')).toBe('DENY')
  })

  it('Referrer-Policy نشتی ندارد', () => {
    expect(headerValue(buildSecurityHeaders(false), 'Referrer-Policy')).toBe(
      'strict-origin-when-cross-origin'
    )
  })

  it('🔑 HSTS فقط در production', () => {
    expect(headerValue(buildSecurityHeaders(false), 'Strict-Transport-Security')).toContain(
      'max-age='
    )
    // روی localhost، HSTS محیط توسعه را تا دو سال خراب می‌کند
    expect(headerValue(buildSecurityHeaders(true), 'Strict-Transport-Security')).toBeUndefined()
  })

  it('دوربین و میکروفون بسته‌اند', () => {
    const policy = headerValue(buildSecurityHeaders(false), 'Permissions-Policy') ?? ''
    expect(policy).toContain('camera=()')
    expect(policy).toContain('microphone=()')
  })
})

describe('هدرهای ناحیهٔ admin', () => {
  it('🔑 پاسخ پنل کش نمی‌شود', () => {
    // کش پراکسی می‌تواند صفحهٔ یک مدیر را به دیگری بدهد
    expect(headerValue(buildAdminHeaders(false), 'Cache-Control')).toContain('no-store')
  })

  it('🔑 صفحهٔ ورود ایندکس نمی‌شود', () => {
    expect(headerValue(buildAdminHeaders(false), 'X-Robots-Tag')).toContain('noindex')
  })

  it('همهٔ هدرهای عمومی را هم دارد', () => {
    const common = buildSecurityHeaders(false).map((header) => header.key)
    const admin = buildAdminHeaders(false).map((header) => header.key)
    for (const key of common) expect(admin).toContain(key)
  })

  it('میزبان GA4 را به پنل ادمین اضافه نمی‌کند', () => {
    const csp = headerValue(buildAdminHeaders(false), 'Content-Security-Policy') ?? ''
    expect(csp).not.toContain('googletagmanager')
    expect(csp).not.toContain('google-analytics')
  })
})
