import { describe, expect, it } from 'vitest'
import {
  buildTotpUri,
  fromBase32,
  generateTotpCode,
  generateTotpSecret,
  toBase32,
  TOTP_DIGITS,
  TOTP_PERIOD_SECONDS,
  verifyTotpCode,
} from '@/lib/auth/server/totp'

/**
 * ورود دومرحله‌ای (TOTP).
 *
 * ══════════════════════════════════════════════════════════════
 *  چرا بردارهای رسمی RFC مهم‌اند
 * ══════════════════════════════════════════════════════════════
 * پیاده‌سازی TOTP بدون وابستگی خارجی انجام شده. اگر حتی یک بیت
 * جابه‌جا باشد، کدها با Google Authenticator نمی‌خوانند — و این
 * را فقط با دست آزمودن معلوم می‌شود، نه با تست‌های خودساخته.
 *
 * بردارهای زیر مستقیم از **RFC 6238 Appendix B** آمده‌اند و
 * مرجع رسمی استانداردند.
 */

/** کلید آزمون RFC: رشتهٔ "12345678901234567890" در Base32 */
const RFC_SECRET = toBase32(Buffer.from('12345678901234567890'))

describe('🔑 سازگاری با RFC 6238', () => {
  /*
    اگر این تست بشکند، یعنی کدهای تولیدی با هیچ برنامهٔ
    احراز هویت استانداردی نمی‌خوانند.
  */
  const vectors: Array<[number, string]> = [
    [59, '287082'],
    [1_111_111_109, '081804'],
    [1_111_111_111, '050471'],
    [1_234_567_890, '005924'],
    [2_000_000_000, '279037'],
  ]

  for (const [time, expected] of vectors) {
    it(`t=${time} → ${expected}`, () => {
      expect(generateTotpCode(RFC_SECRET, time)).toBe(expected)
    })
  }
})

describe('Base32', () => {
  it('رفت و برگشت بدون تغییر', () => {
    const original = Buffer.from('12345678901234567890')
    expect(fromBase32(toBase32(original)).equals(original)).toBe(true)
  })

  it('فقط از الفبای مجاز استفاده می‌کند', () => {
    // اگر کاراکتر خارج از این مجموعه باشد، برنامه‌های موبایل
    // نمی‌توانند کلید را وارد کنند
    expect(generateTotpSecret()).toMatch(/^[A-Z2-7]+$/)
  })

  it('کاراکتر نامعتبر خطا می‌دهد', () => {
    expect(() => fromBase32('INVALID-CHARS!')).toThrow()
  })

  it('فاصله و padding نادیده گرفته می‌شود', () => {
    // کاربر معمولاً کلید را با فاصله کپی می‌کند
    const secret = generateTotpSecret()
    const spaced = secret.match(/.{1,4}/g)?.join(' ') ?? secret
    expect(fromBase32(spaced).equals(fromBase32(secret))).toBe(true)
  })
})

describe('ساخت کلید', () => {
  it('هر بار کلید متفاوت می‌سازد', () => {
    expect(generateTotpSecret()).not.toBe(generateTotpSecret())
  })

  it('🔑 کلید به اندازهٔ کافی بلند است', () => {
    // ۲۰ بایت طبق RFC 4226 → ۳۲ کاراکتر Base32
    expect(generateTotpSecret().length).toBeGreaterThanOrEqual(32)
  })
})

describe('تأیید کد', () => {
  const secret = generateTotpSecret()
  const now = 1_700_000_000

  it('کد لحظهٔ فعلی پذیرفته می‌شود', () => {
    const code = generateTotpCode(secret, now)
    expect(verifyTotpCode(secret, code, { atSeconds: now })).toBe(true)
  })

  it('🔑 کد غلط رد می‌شود', () => {
    expect(verifyTotpCode(secret, '000000', { atSeconds: now })).toBe(false)
  })

  it('کد پنجرهٔ قبلی پذیرفته می‌شود — جبران اختلاف ساعت', () => {
    const code = generateTotpCode(secret, now - TOTP_PERIOD_SECONDS)
    expect(verifyTotpCode(secret, code, { atSeconds: now })).toBe(true)
  })

  it('کد پنجرهٔ بعدی پذیرفته می‌شود', () => {
    const code = generateTotpCode(secret, now + TOTP_PERIOD_SECONDS)
    expect(verifyTotpCode(secret, code, { atSeconds: now })).toBe(true)
  })

  it('🔑 کد خیلی قدیمی رد می‌شود', () => {
    /*
      اگر پنجره بی‌حد بود، کدی که مهاجم از روی شانه دیده تا
      ابد معتبر می‌ماند.
    */
    const code = generateTotpCode(secret, now - 10 * TOTP_PERIOD_SECONDS)
    expect(verifyTotpCode(secret, code, { atSeconds: now })).toBe(false)
  })

  it('کد با فاصله پذیرفته می‌شود', () => {
    // بعضی برنامه‌ها کد را «123 456» نشان می‌دهند
    const code = generateTotpCode(secret, now)
    const spaced = `${code.slice(0, 3)} ${code.slice(3)}`
    expect(verifyTotpCode(secret, spaced, { atSeconds: now })).toBe(true)
  })

  it('🔑 ورودی غیرعددی رد می‌شود', () => {
    for (const bad of ['abcdef', '12345', '1234567', '', '12a456']) {
      expect(verifyTotpCode(secret, bad, { atSeconds: now })).toBe(false)
    }
  })

  it('🔑 کلید متفاوت، کد را رد می‌کند', () => {
    const other = generateTotpSecret()
    const code = generateTotpCode(other, now)
    expect(verifyTotpCode(secret, code, { atSeconds: now })).toBe(false)
  })

  it('کلید خراب باعث خطا نمی‌شود', () => {
    expect(verifyTotpCode('!!!invalid!!!', '123456', { atSeconds: now })).toBe(false)
  })
})

describe('URI برای اسکن', () => {
  it('فرمت otpauth استاندارد می‌سازد', () => {
    const uri = buildTotpUri('JBSWY3DPEHPK3PXP', 'admin', 'Saite')
    expect(uri.startsWith('otpauth://totp/')).toBe(true)
    expect(uri).toContain('secret=JBSWY3DPEHPK3PXP')
    expect(uri).toContain('issuer=Saite')
    expect(uri).toContain(`digits=${TOTP_DIGITS}`)
    expect(uri).toContain(`period=${TOTP_PERIOD_SECONDS}`)
  })

  it('نام حساب با کاراکتر خاص درست کدگذاری می‌شود', () => {
    const uri = buildTotpUri('JBSWY3DPEHPK3PXP', 'admin@saite.local', 'Saite Shop')
    expect(uri).not.toContain(' ')
  })
})
