import { describe, expect, it } from 'vitest'
import {
  buildAdminHeaders,
  buildContentSecurityPolicy,
  buildSecurityHeaders,
  generateNonce,
  NONCE_HEADER,
} from '@/lib/security-headers'

/*
  فاز D — nonce و strict-dynamic.

  این تست‌ها تضمین می‌کنند که:
    ۱. با nonce، script-src شامل nonce+strict-dynamic است
    ۲. بدون nonce، رفتار قدیمی (unsafe-inline) حفظ می‌شود
    ۳. generateNonce آنتروپی کافی دارد و base64url است
*/

describe('CSP با nonce', () => {
  it('nonce در script-src قرار می‌گیرد', () => {
    const csp = buildContentSecurityPolicy(false, 'ABC123')
    expect(csp).toContain("'nonce-ABC123'")
  })

  it('strict-dynamic فقط با nonce فعال می‌شود', () => {
    const withNonce = buildContentSecurityPolicy(false, 'XYZ')
    expect(withNonce).toContain("'strict-dynamic'")

    const withoutNonce = buildContentSecurityPolicy(false)
    expect(withoutNonce).not.toContain("'strict-dynamic'")
  })

  it('unsafe-inline به‌عنوان fallback برای مرورگرهای قدیمی می‌ماند', () => {
    // مرورگرهای مدرن با strict-dynamic آن را نادیده می‌گیرند
    // مرورگرهای قدیمی (Safari <15.4) از این استفاده می‌کنند
    const csp = buildContentSecurityPolicy(false, 'X')
    expect(csp).toContain("'unsafe-inline'")
  })

  it('در دِو، unsafe-eval هم اضافه می‌شود (Fast Refresh)', () => {
    const dev = buildContentSecurityPolicy(true, 'X')
    expect(dev).toContain("'unsafe-eval'")
  })

  it('در پروداکشن، unsafe-eval نیست', () => {
    const prod = buildContentSecurityPolicy(false, 'X')
    expect(prod).not.toContain("'unsafe-eval'")
  })
})

describe('CSP بدون nonce (سازگاری عقب برای صفحات public)', () => {
  it('script-src فقط self + unsafe-inline (رفتار قبل از فاز D)', () => {
    const csp = buildContentSecurityPolicy(false)
    // بدون nonce نه strict-dynamic اضافه می‌شود
    expect(csp).not.toContain("'strict-dynamic'")
    // نه nonce
    expect(csp).not.toMatch(/'nonce-/)
    // ولی unsafe-inline هست تا اسکریپت‌های hydration Next اجرا شوند
    expect(csp).toContain("'unsafe-inline'")
  })
})

describe('buildSecurityHeaders(nonce)', () => {
  it('nonce به CSP اعمال می‌شود ولی سایر هدرها یکسان می‌مانند', () => {
    const withNonce = buildSecurityHeaders(false, 'MY-NONCE-123')
    const cspHeader = withNonce.find((h) => h.key === 'Content-Security-Policy')
    expect(cspHeader?.value).toContain("'nonce-MY-NONCE-123'")

    // این‌ها به nonce وابسته نیستند
    expect(withNonce.find((h) => h.key === 'X-Frame-Options')?.value).toBe('DENY')
    expect(withNonce.find((h) => h.key === 'Referrer-Policy')?.value).toBe(
      'strict-origin-when-cross-origin'
    )
  })
})

describe('buildAdminHeaders(nonce)', () => {
  it('هم nonce دارد هم no-store', () => {
    const admin = buildAdminHeaders(false, 'N1')
    expect(admin.find((h) => h.key === 'Content-Security-Policy')?.value).toContain(
      "'nonce-N1'"
    )
    expect(admin.find((h) => h.key === 'Cache-Control')?.value).toContain('no-store')
    expect(admin.find((h) => h.key === 'X-Robots-Tag')?.value).toContain('noindex')
  })
})

describe('generateNonce', () => {
  it('یک رشتهٔ base64url غیرخالی برمی‌گرداند', () => {
    const nonce = generateNonce()
    expect(typeof nonce).toBe('string')
    expect(nonce.length).toBeGreaterThan(0)
    // base64url فقط این کاراکترها را دارد
    expect(nonce).toMatch(/^[A-Za-z0-9_-]+$/)
  })

  it('هر بار مقدار متفاوت (آنتروپی کافی)', () => {
    // ۱۰۰ nonce تولید کن — نباید تکراری داشته باشیم
    const nonces = new Set<string>()
    for (let i = 0; i < 100; i++) {
      nonces.add(generateNonce())
    }
    expect(nonces.size).toBe(100)
  })

  it('طول تقریباً ۲۲ کاراکتر (۱۶ بایت random → base64url)', () => {
    // 16 بایت = 22 کاراکتر base64url (بدون padding)
    expect(generateNonce().length).toBeGreaterThanOrEqual(20)
    expect(generateNonce().length).toBeLessThanOrEqual(24)
  })
})

describe('NONCE_HEADER ثابت', () => {
  it('نام هدر داخلی همان است که proxy می‌گذارد و رندر می‌خواند', () => {
    // اگر این تغییر کند و proxy/رندر همزمان به‌روز نشوند، nonce
    // منتشر نمی‌شود و اسکریپت‌های hydration مسدود می‌شوند
    expect(NONCE_HEADER).toBe('x-nonce')
  })
})
