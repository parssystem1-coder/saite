import { describe, expect, it } from 'vitest'
import {
  HASH_PREFIX,
  hashPassword,
  isPasswordHash,
  verifyPassword,
} from '@/lib/auth/server/password-hash'

/**
 * هش رمز با scrypt.
 *
 * این تست‌ها ادعای «رمز از روی فایل قابل بازیابی نیست» را
 * می‌سنجند. اگر هش شکستنی یا قابل پیش‌بینی باشد، ذخیره‌سازی
 * هش‌شده هیچ چیزی اضافه نکرده.
 */

describe('ساخت هش', () => {
  it('هش با پیشوند قابل تشخیص ساخته می‌شود', async () => {
    const hash = await hashPassword('my-strong-pass-1404')
    expect(hash.startsWith(HASH_PREFIX)).toBe(true)
  })

  it('🔑 رمز اصلی در هش دیده نمی‌شود', async () => {
    const password = 'super-secret-passphrase'
    const hash = await hashPassword(password)
    expect(hash).not.toContain(password)
  })

  it('🔑 دو بار هش کردن یک رمز، نتیجهٔ متفاوت می‌دهد', async () => {
    /*
      نمک تصادفی. بدون آن، دو حساب با رمز یکسان هش یکسان
      می‌گرفتند و جدول‌های از پیش محاسبه‌شده کار می‌کردند.
    */
    const a = await hashPassword('same-password-123')
    const b = await hashPassword('same-password-123')
    expect(a).not.toBe(b)
  })

  it('پارامترها داخل خود هش ذخیره می‌شوند', async () => {
    // تا اگر بعداً سخت‌گیرانه‌ترشان کردیم، هش‌های قدیمی کار کنند
    const hash = await hashPassword('test-password-1')
    const parts = hash.split('.')
    expect(parts).toHaveLength(6)
    expect(parts[0]).toBe('scrypt')
    expect(Number(parts[1])).toBeGreaterThanOrEqual(16_384)
  })
})

describe('تأیید رمز', () => {
  it('رمز درست پذیرفته می‌شود', async () => {
    const hash = await hashPassword('correct-horse-battery')
    expect(await verifyPassword('correct-horse-battery', hash)).toBe(true)
  })

  it('🔑 رمز غلط رد می‌شود', async () => {
    const hash = await hashPassword('correct-horse-battery')
    expect(await verifyPassword('wrong-password', hash)).toBe(false)
  })

  it('🔑 رمز با یک کاراکتر تفاوت رد می‌شود', async () => {
    const hash = await hashPassword('password-1404')
    expect(await verifyPassword('password-1405', hash)).toBe(false)
  })

  it('حساس به حروف بزرگ و کوچک است', async () => {
    const hash = await hashPassword('MyPassword123')
    expect(await verifyPassword('mypassword123', hash)).toBe(false)
  })

  it('رمز خالی رد می‌شود', async () => {
    const hash = await hashPassword('real-password-99')
    expect(await verifyPassword('', hash)).toBe(false)
  })
})

describe('🔑 مقاومت در برابر ورودی خراب', () => {
  it('هش بدشکل باعث خطا نمی‌شود — فقط رد', async () => {
    for (const bad of [
      '',
      'not-a-hash',
      'scrypt.',
      'scrypt.1.2.3',
      'scrypt.a.b.c.d.e',
      'bcrypt.16384.8.1.aaaa.bbbb',
      // فرمت قدیمی با $ — دیگر پشتیبانی نمی‌شود
      'scrypt$16384$8$1$aaaa$bbbb',
    ]) {
      await expect(verifyPassword('anything', bad)).resolves.toBe(false)
    }
  })

  it('🔑 پارامتر غول‌آسا رد می‌شود — جلوگیری از حملهٔ منع سرویس', async () => {
    /*
      اگر N بی‌حد پذیرفته می‌شد، یک مقدار دستکاری‌شده در
      .env.local می‌توانست با مصرف چند گیگابایت حافظه سرور را
      بخواباند.
    */
    const evil = `scrypt.99999999.8.1.${Buffer.from('salt').toString('base64url')}.${Buffer.from('hash').toString('base64url')}`
    await expect(verifyPassword('anything', evil)).resolves.toBe(false)
  })

  it('نمک یا هش خالی رد می‌شود', async () => {
    await expect(verifyPassword('x', 'scrypt.16384.8.1..')).resolves.toBe(false)
  })
})

describe('🔑 سازگاری با فایل .env', () => {
  /*
    ══════════════════════════════════════════════════════════
     تلهٔ واقعی که در آزمایش با سرور پیدا شد
    ══════════════════════════════════════════════════════════
    Next.js مقادیر `.env` را از تابع `expand` رد می‌کند (بستهٔ
    `@next/env`). آن تابع `$16384` را یک **متغیر** می‌بیند و با
    رشتهٔ خالی جایگزین می‌کند:

      scrypt$16384$8$1$AbCd+/==$XyZ123==
      → scrypt6384+/====

    یعنی هش بی‌صدا نابود می‌شد و ورود همیشه «رمز نادرست» می‌داد،
    بدون هیچ پیام خطایی که علت را نشان دهد.

    این تست‌ها تضمین می‌کنند فرمت هش هرگز کاراکتری نداشته باشد
    که در فایل env معنای خاص دارد.
  */

  it('🔑 هش هیچ `$` ندارد — وگرنه Next آن را بسط می‌دهد', async () => {
    const hash = await hashPassword('any-password-123')
    expect(hash).not.toContain('$')
  })

  it('🔑 هش کاراکتر `+`، `/` یا `=` ندارد', async () => {
    /*
      base64 استاندارد این سه را تولید می‌کند و هر سه در
      پوسته‌های فرمان و بعضی پارسرهای env دردسر می‌سازند.
      base64url هیچ‌کدام را ندارد.
    */
    for (let i = 0; i < 20; i++) {
      const hash = await hashPassword(`password-${i}`)
      expect(hash).not.toMatch(/[+/=]/)
    }
  })

  it('هش فقط از کاراکترهای امن ساخته می‌شود', async () => {
    const hash = await hashPassword('another-password-1')
    expect(hash).toMatch(/^[A-Za-z0-9._-]+$/)
  })

  it('🔑 پس از عبور از expand سالم می‌ماند', async () => {
    // بازتولید همان منطقی که @next/env اجرا می‌کند
    function interpolate(value: string): string {
      const matches = Array.from(value.matchAll(/(?!(?<=\\))\$/g))
      const last = matches.length > 0 ? matches.slice(-1)[0].index : -1
      if (last === -1) return value

      const tail = value.slice(last)
      const match = tail.match(/((?!(?<=\\))\$\{?([\w]+)(?::-([^}\\]*))?\}?)/)
      if (match == null) return value

      const [, token, , fallback] = match
      return interpolate(value.replace(token, fallback || ''))
    }

    const hash = await hashPassword('env-safe-password')
    expect(interpolate(hash)).toBe(hash)
  })
})

describe('تشخیص نوع مقدار', () => {
  it('هش را تشخیص می‌دهد', async () => {
    expect(isPasswordHash(await hashPassword('test-pass-123'))).toBe(true)
  })

  it('🔑 رمز متن ساده را هش نمی‌شمارد', () => {
    // اگر این اشتباه شود، رمز متن ساده به‌عنوان هش تأیید می‌شود
    // و هیچ‌کس نمی‌تواند وارد شود
    expect(isPasswordHash('saite-demo-1404')).toBe(false)
    expect(isPasswordHash('scrypt$16384$8$1$a$b')).toBe(false)
    expect(isPasswordHash('')).toBe(false)
    expect(isPasswordHash(undefined)).toBe(false)
    expect(isPasswordHash(null)).toBe(false)
  })
})
