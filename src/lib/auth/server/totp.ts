import 'server-only'

import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'

/**
 * احراز هویت دومرحله‌ای (TOTP) — سازگار با RFC 6238.
 *
 * ══════════════════════════════════════════════════════════════
 *  چرا بدون وابستگی خارجی
 * ══════════════════════════════════════════════════════════════
 * کل الگوریتم حدود ۴۰ خط است و فقط به `createHmac` نیاز دارد که
 * در خود Node هست. آوردن یک بستهٔ npm برای این کار یعنی اضافه
 * کردن یک وابستگی به مسیر بحرانی احراز هویت — جایی که هر
 * وابستگی یک سطح حمله است.
 *
 * پیاده‌سازی با **بردارهای آزمون رسمی RFC 6238** راستی‌آزمایی شده
 * (`tests/lib/totp.test.ts`)، پس با Google Authenticator، Authy،
 * 1Password و هر برنامهٔ استاندارد دیگری کار می‌کند.
 *
 * ── چرا SHA-1؟ ────────────────────────────────────────────────
 * چون استاندارد TOTP آن را تعریف کرده و همهٔ برنامه‌های موبایل
 * همان را انتظار دارند. ضعف شناخته‌شدهٔ SHA-1 در برخورد
 * (collision) است، نه در HMAC — و اینجا از HMAC استفاده می‌شود.
 *
 * ── چرا کد شش‌رقمی امن است؟ ───────────────────────────────────
 * یک میلیون حالت در پنجرهٔ ۳۰ ثانیه‌ای زیاد نیست، اما با
 * محدودیت نرخ سرور (۱۰ تلاش در ۱۵ دقیقه) حدس‌زدنش عملاً ناممکن
 * می‌شود. به همین دلیل TOTP بدون rate limit بی‌معناست.
 */

/** طول پنجرهٔ زمانی به ثانیه — استاندارد */
export const TOTP_PERIOD_SECONDS = 30

/** تعداد ارقام کد */
export const TOTP_DIGITS = 6

/**
 * چند پنجرهٔ قبل/بعد پذیرفته شود.
 *
 * `1` یعنی کد پنجرهٔ قبلی، فعلی و بعدی معتبرند — مجموعاً ۹۰
 * ثانیه. این برای جبران اختلاف ساعت گوشی و سرور لازم است.
 * مقدار بزرگ‌تر پنجرهٔ حمله را بی‌دلیل باز می‌کند.
 */
const DEFAULT_WINDOW = 1

/* ── Base32 (RFC 4648) — فرمتی که برنامه‌های احراز هویت می‌فهمند ── */

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

export function toBase32(buffer: Buffer): string {
  let bits = 0
  let value = 0
  let output = ''

  for (const byte of buffer) {
    value = (value << 8) | byte
    bits += 8
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31]
      bits -= 5
    }
  }

  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31]
  }

  return output
}

export function fromBase32(input: string): Buffer {
  const clean = input.toUpperCase().replace(/=+$/, '').replace(/\s/g, '')
  let bits = 0
  let value = 0
  const bytes: number[] = []

  for (const char of clean) {
    const index = BASE32_ALPHABET.indexOf(char)
    if (index === -1) throw new Error('کاراکتر نامعتبر در کلید Base32')

    value = (value << 5) | index
    bits += 5

    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff)
      bits -= 8
    }
  }

  return Buffer.from(bytes)
}

/** ساخت کلید مخفی تازه — ۲۰ بایت، استاندارد RFC 4226 */
export function generateTotpSecret(): string {
  return toBase32(randomBytes(20))
}

/** محاسبهٔ کد برای یک لحظهٔ مشخص */
export function generateTotpCode(secretBase32: string, atSeconds: number): string {
  const counter = Math.floor(atSeconds / TOTP_PERIOD_SECONDS)
  const counterBuffer = Buffer.alloc(8)
  counterBuffer.writeBigUInt64BE(BigInt(counter))

  const digest = createHmac('sha1', fromBase32(secretBase32))
    .update(counterBuffer)
    .digest()

  // truncation پویا طبق RFC 4226 §5.3
  const offset = digest[digest.length - 1] & 0x0f
  const binary =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff)

  return String(binary % 10 ** TOTP_DIGITS).padStart(TOTP_DIGITS, '0')
}

/**
 * تأیید کد واردشده.
 *
 * مقایسه زمان‌ثابت است تا مهاجم نتواند از اختلاف زمان پاسخ،
 * رقم‌به‌رقم کد را بسازد.
 */
export function verifyTotpCode(
  secretBase32: string,
  code: string,
  options: { atSeconds?: number; window?: number } = {}
): boolean {
  const normalized = code.replace(/\s/g, '')
  if (!/^\d+$/.test(normalized) || normalized.length !== TOTP_DIGITS) return false

  const at = options.atSeconds ?? Math.floor(Date.now() / 1000)
  const window = options.window ?? DEFAULT_WINDOW

  for (let drift = -window; drift <= window; drift++) {
    let expected: string
    try {
      expected = generateTotpCode(secretBase32, at + drift * TOTP_PERIOD_SECONDS)
    } catch {
      return false
    }

    const a = Buffer.from(expected)
    const b = Buffer.from(normalized)
    if (a.length === b.length && timingSafeEqual(a, b)) return true
  }

  return false
}

/**
 * ساخت URI برای اسکن با دوربین.
 *
 * برنامه‌های احراز هویت این فرمت را می‌شناسند و با اسکن QR
 * حساب را اضافه می‌کنند.
 */
export function buildTotpUri(
  secretBase32: string,
  accountName: string,
  issuer: string
): string {
  const label = encodeURIComponent(`${issuer}:${accountName}`)
  const params = new URLSearchParams({
    secret: secretBase32,
    issuer,
    algorithm: 'SHA1',
    digits: String(TOTP_DIGITS),
    period: String(TOTP_PERIOD_SECONDS),
  })
  return `otpauth://totp/${label}?${params.toString()}`
}
