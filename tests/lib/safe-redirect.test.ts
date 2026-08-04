import { describe, expect, it } from 'vitest'
import {
  DEFAULT_REDIRECT,
  isAdminPath,
  isSafeRedirectPath,
  resolveSafeRedirect,
} from '@/lib/auth/safe-redirect'

/**
 * محافظت در برابر Open Redirect.
 *
 * سناریوی حمله: مهاجم لینکی با دامنهٔ واقعی سایت می‌سازد
 *   /login?redirect=https://evil.example/fake
 * کاربر لینک را باور می‌کند، وارد می‌شود و به سایت جعلی می‌رود.
 */
describe('isSafeRedirectPath — مسیرهای مجاز', () => {
  it('مسیر نسبی داخلی را می‌پذیرد', () => {
    expect(isSafeRedirectPath('/admin')).toBe(true)
    expect(isSafeRedirectPath('/admin/orders')).toBe(true)
    expect(isSafeRedirectPath('/products?category=printer')).toBe(true)
    expect(isSafeRedirectPath('/cart#summary')).toBe(true)
  })
})

describe('isSafeRedirectPath — حمله‌های رد شده', () => {
  it('🔑 URL مطلق به دامنهٔ خارجی', () => {
    expect(isSafeRedirectPath('https://evil.example')).toBe(false)
    expect(isSafeRedirectPath('http://evil.example/login')).toBe(false)
  })

  it('🔑 protocol-relative — رایج‌ترین دور زدن', () => {
    // //evil.com در مرورگر یعنی https://evil.com
    expect(isSafeRedirectPath('//evil.example')).toBe(false)
    expect(isSafeRedirectPath('//evil.example/fake-login')).toBe(false)
  })

  it('🔑 backslash که بعضی مرورگرها مثل اسلش می‌بینند', () => {
    expect(isSafeRedirectPath('/\\evil.example')).toBe(false)
    expect(isSafeRedirectPath('\\\\evil.example')).toBe(false)
  })

  it('🔑 پروتکل اجرایی javascript:', () => {
    expect(isSafeRedirectPath('javascript:alert(1)')).toBe(false)
    expect(isSafeRedirectPath('/javascript:alert(1)')).toBe(false)
    expect(isSafeRedirectPath('data:text/html,<script>')).toBe(false)
  })

  it('🔑 تزریق کاراکتر کنترلی و newline', () => {
    expect(isSafeRedirectPath('/admin\nSet-Cookie: x=1')).toBe(false)
    expect(isSafeRedirectPath('/admin\r\nLocation: evil')).toBe(false)
    expect(isSafeRedirectPath('/admin\u0000')).toBe(false)
  })

  it('مسیر بدون اسلش ابتدایی', () => {
    expect(isSafeRedirectPath('admin')).toBe(false)
    expect(isSafeRedirectPath('evil.example/path')).toBe(false)
  })

  it('مقدار خالی یا بیش از حد طولانی', () => {
    expect(isSafeRedirectPath(null)).toBe(false)
    expect(isSafeRedirectPath(undefined)).toBe(false)
    expect(isSafeRedirectPath('')).toBe(false)
    expect(isSafeRedirectPath('   ')).toBe(false)
    expect(isSafeRedirectPath('/' + 'a'.repeat(600))).toBe(false)
  })
})

describe('resolveSafeRedirect', () => {
  it('مسیر معتبر را برمی‌گرداند', () => {
    expect(resolveSafeRedirect('/admin/orders', '/admin')).toBe('/admin/orders')
  })

  it('🔑 مسیر مخرب را با پیش‌فرض جایگزین می‌کند', () => {
    expect(resolveSafeRedirect('https://evil.example', '/dashboard')).toBe('/dashboard')
    expect(resolveSafeRedirect('//evil.example', '/dashboard')).toBe('/dashboard')
    expect(resolveSafeRedirect(null, '/dashboard')).toBe('/dashboard')
  })
})

describe('isAdminPath', () => {
  it('مسیرهای پنل را تشخیص می‌دهد', () => {
    expect(isAdminPath('/admin')).toBe(true)
    expect(isAdminPath('/admin/orders')).toBe(true)
  })

  it('🔑 مسیر فریبنده‌ای که با admin شروع می‌شود را رد می‌کند', () => {
    expect(isAdminPath('/administration')).toBe(false)
    expect(isAdminPath('/admin-panel')).toBe(false)
    expect(isAdminPath('/adminx')).toBe(false)
  })

  it('مسیر ناامن هرگز ادمین شمرده نمی‌شود', () => {
    expect(isAdminPath('//evil.example/admin')).toBe(false)
    expect(isAdminPath('https://evil.example/admin')).toBe(false)
  })

  it('مقدار خالی', () => {
    expect(isAdminPath(null)).toBe(false)
    expect(isAdminPath('/products')).toBe(false)
  })
})

describe('DEFAULT_REDIRECT', () => {
  it('هر نقش مقصد پیش‌فرض خودش را دارد', () => {
    expect(DEFAULT_REDIRECT.admin).toBe('/admin')
    expect(DEFAULT_REDIRECT.user).toBe('/dashboard')
  })
})
