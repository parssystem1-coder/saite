import { beforeEach, describe, expect, it } from 'vitest'
import {
  __resetAllRateLimits,
  consumeRateLimit,
  getClientKey,
  getUsernameKey,
  USERNAME_RATE_LIMIT,
} from '@/lib/auth/server/rate-limit'

/**
 * سطل دوم: محدودیت بر اساس حساب.
 *
 * ── چرا سطل IP کافی نبود ──────────────────────────────────────
 * سقف ۱۰ تلاش «به ازای هر IP» است. مهاجم با ۵۰۰ پروکسی ارزان،
 * ۵۰۰ سطل جدا می‌گیرد و ۵۰۰۰ رمز تست می‌کند بدون آنکه یک بار هم
 * به سقف بخورد.
 */

beforeEach(async () => {
  await __resetAllRateLimits()
})

describe('کلید نام کاربری', () => {
  it('🔑 حروف بزرگ و کوچک یک سطل‌اند', () => {
    // وگرنه Admin / ADMIN / admin سه سقف جدا می‌گیرند
    expect(getUsernameKey('ADMIN')).toBe(getUsernameKey('admin'))
  })

  it('🔑 فاصلهٔ اضافی سطل جدید نمی‌سازد', () => {
    expect(getUsernameKey('  admin  ')).toBe(getUsernameKey('admin'))
  })

  it('حساب‌های متفاوت سطل جدا دارند', () => {
    expect(getUsernameKey('admin')).not.toBe(getUsernameKey('root'))
  })

  it('پیشوند دارد تا با کلید IP قاطی نشود', () => {
    expect(getUsernameKey('admin')).toContain('admin-login-user:')
  })
})

describe('سقف حساب', () => {
  it('🔑 حملهٔ توزیع‌شده را می‌گیرد', async () => {
    const key = getUsernameKey('admin')
    const { maxAttempts, windowMs } = USERNAME_RATE_LIMIT

    // هر تلاش از یک IP متفاوت می‌آید، پس سطل IP هرگز پر نمی‌شود
    for (let i = 0; i < maxAttempts; i++) {
      expect((await consumeRateLimit(key, maxAttempts, windowMs)).allowed).toBe(true)
    }

    expect((await consumeRateLimit(key, maxAttempts, windowMs)).allowed).toBe(false)
  })

  it('سقف حساب از سقف IP سخاوتمندانه‌تر است', () => {
    // مدیر واقعی که رمز را فراموش کرده نباید با ۱۰ تلاش یک ساعت قفل شود
    expect(USERNAME_RATE_LIMIT.maxAttempts).toBeGreaterThan(10)
    expect(USERNAME_RATE_LIMIT.windowMs).toBeGreaterThanOrEqual(60 * 60_000)
  })

  it('قفل یک حساب، حساب دیگر را قفل نمی‌کند', async () => {
    const admin = getUsernameKey('admin')
    for (let i = 0; i <= USERNAME_RATE_LIMIT.maxAttempts; i++) {
      await consumeRateLimit(admin, USERNAME_RATE_LIMIT.maxAttempts, USERNAME_RATE_LIMIT.windowMs)
    }

    expect(
      (await consumeRateLimit(admin, USERNAME_RATE_LIMIT.maxAttempts, USERNAME_RATE_LIMIT.windowMs))
        .allowed
    ).toBe(false)
    expect(
      (
        await consumeRateLimit(
          getUsernameKey('other'),
          USERNAME_RATE_LIMIT.maxAttempts,
          USERNAME_RATE_LIMIT.windowMs
        )
      ).allowed
    ).toBe(true)
  })
})

describe('پراکسی مورد اعتماد', () => {
  it('بدون تنظیم، رفتار قبلی حفظ می‌شود', () => {
    delete process.env.TRUSTED_PROXY_HOPS
    const headers = new Headers({ 'x-forwarded-for': '203.0.113.5, 70.41.3.18' })
    expect(getClientKey(headers)).toBe('203.0.113.5')
  })

  it('🔑 با یک hop، IP نوشتهٔ پراکسی خودمان را می‌گیرد', () => {
    /*
      اولین عنصر را خود کلاینت می‌نویسد و جعلی است. آخرین عنصر را
      پراکسی تحت کنترل ما اضافه کرده، پس قابل اعتماد است.
    */
    process.env.TRUSTED_PROXY_HOPS = '1'
    const headers = new Headers({ 'x-forwarded-for': '1.1.1.1, 203.0.113.5' })
    expect(getClientKey(headers)).toBe('203.0.113.5')
    delete process.env.TRUSTED_PROXY_HOPS
  })

  it('اگر زنجیره کوتاه‌تر از hop باشد، به اولین عنصر برمی‌گردد', () => {
    process.env.TRUSTED_PROXY_HOPS = '5'
    const headers = new Headers({ 'x-forwarded-for': '203.0.113.5' })
    expect(getClientKey(headers)).toBe('203.0.113.5')
    delete process.env.TRUSTED_PROXY_HOPS
  })
})
