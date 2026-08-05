import 'server-only'

import { randomBytes, scrypt, timingSafeEqual, type ScryptOptions } from 'node:crypto'

/**
 * هش رمز با scrypt.
 *
 * ══════════════════════════════════════════════════════════════
 *  چرا scrypt و نه bcrypt یا argon2
 * ══════════════════════════════════════════════════════════════
 * هر دوی آن‌ها بستهٔ native می‌خواهند که باید کامپایل شود. روی
 * ویندوز این یعنی نصب Visual Studio Build Tools — یک مانع واقعی
 * برای پروژه‌ای که قرار است با `npm install` ساده راه بیفتد.
 *
 * `scrypt` در **خود Node.js** است (`node:crypto`)، طراحی‌شده برای
 * همین کار، و در برابر حملهٔ سخت‌افزاری (GPU/ASIC) مقاوم است چون
 * علاوه بر CPU به حافظه هم نیاز دارد.
 *
 * OWASP هر سه را می‌پذیرد. تفاوتشان در این کاربرد عملی نیست.
 *
 * ── فرمت ذخیره ────────────────────────────────────────────────
 *   scrypt.N.r.p.saltBase64url.hashBase64url
 *
 * پارامترها داخل خود رشته‌اند، پس اگر روزی سخت‌گیرانه‌ترشان کردیم،
 * هش‌های قدیمی همچنان تأیید می‌شوند — بدون نیاز به مهاجرت.
 *
 * ── چرا `.` و نه `$` که استاندارد PHC است؟ ────────────────────
 * چون Next.js مقادیر `.env` را از تابع `expand` رد می‌کند و آن
 * `$16384` را یک **متغیر** می‌بیند و با رشتهٔ خالی جایگزین
 * می‌کند. نتیجهٔ واقعی که در آزمایش دیدیم:
 *
 *   scrypt$16384$8$1$AbCd+/==$XyZ123==
 *   → scrypt6384+/====        (هش نابود شد)
 *
 * راه دیگر این بود که کاربر هر `$` را با `\$` فرار دهد، اما آن
 * یک تلهٔ خاموش است: یک بار فراموشی و ورود بی‌دلیل شکست می‌خورد
 * بدون هیچ پیام روشنی.
 *
 * جداکنندهٔ `.` و کدگذاری base64url (که `+` و `/` ندارد) این
 * مشکل را از ریشه حذف می‌کنند — مقدار در هر فایل env و هر پوستهٔ
 * فرمان بدون نقل‌قول امن است.
 *
 * ── چرا نمک (salt) تصادفی؟ ────────────────────────────────────
 * بدون آن، دو مدیر با رمز یکسان هش یکسان می‌گرفتند و جدول‌های
 * از پیش محاسبه‌شده (rainbow table) کار می‌کردند.
 */

/**
 * پوشش Promise دور `scrypt`.
 *
 * `promisify` اینجا کار نمی‌کند چون امضای `scrypt` چند حالت
 * overload دارد و TypeScript نمی‌تواند حالت با `options` را
 * استنتاج کند. این wrapper صریح همان کار را با تایپ درست می‌کند.
 */
function scryptAsync(
  password: string,
  salt: Buffer,
  keyLength: number,
  options: ScryptOptions
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, keyLength, options, (error, derivedKey) => {
      if (error) reject(error)
      else resolve(derivedKey)
    })
  })
}

/**
 * پارامترهای scrypt.
 *
 * `N=16384` روی سخت‌افزار معمولی حدود ۵۰ میلی‌ثانیه طول می‌کشد —
 * برای کاربر واقعی نامحسوس، برای مهاجمی که میلیون‌ها حدس می‌زند
 * بازدارنده. `maxmem` باید دستی بالا برود چون پیش‌فرض Node برای
 * این پارامترها کم است.
 */
const PARAMS = { N: 16_384, r: 8, p: 1, keyLength: 64 } as const

const MAX_MEM = 128 * PARAMS.N * PARAMS.r * 2

/** پیشوندی که هش‌های این ماژول را از رمز متن ساده جدا می‌کند */
export const HASH_PREFIX = 'scrypt.'

/** base64url — بدون `+`، `/` و `=` که در env دردسر می‌سازند */
function toBase64Url(buffer: Buffer): string {
  return buffer.toString('base64url')
}

function fromBase64Url(value: string): Buffer {
  return Buffer.from(value, 'base64url')
}

/** آیا این رشته یک هش است یا رمز متن ساده؟ */
export function isPasswordHash(value: string | undefined | null): boolean {
  return typeof value === 'string' && value.startsWith(HASH_PREFIX)
}

/** ساخت هش از رمز — خروجی قابل ذخیره در `.env.local` */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16)
  const derived = await scryptAsync(password, salt, PARAMS.keyLength, {
    N: PARAMS.N,
    r: PARAMS.r,
    p: PARAMS.p,
    maxmem: MAX_MEM,
  })

  return [
    'scrypt',
    PARAMS.N,
    PARAMS.r,
    PARAMS.p,
    toBase64Url(salt),
    toBase64Url(derived),
  ].join('.')
}

/**
 * تأیید رمز در برابر هش.
 *
 * `false` برمی‌گرداند اگر هش بدشکل باشد — عمداً throw نمی‌کند تا
 * یک مقدار خراب در `.env.local` باعث ۵۰۰ نشود و به جایش ورود را
 * رد کند.
 */
export async function verifyPassword(
  password: string,
  storedHash: string
): Promise<boolean> {
  const parts = storedHash.split('.')
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false

  const N = Number(parts[1])
  const r = Number(parts[2])
  const p = Number(parts[3])
  if (!Number.isInteger(N) || !Number.isInteger(r) || !Number.isInteger(p)) return false

  // سقف محافظتی: مقدار دستکاری‌شده نباید سرور را با مصرف حافظه بخواباند
  if (N > 1_048_576 || r > 32 || p > 16) return false

  let salt: Buffer
  let expected: Buffer
  try {
    salt = fromBase64Url(parts[4])
    expected = fromBase64Url(parts[5])
  } catch {
    return false
  }

  if (salt.length === 0 || expected.length === 0) return false

  let derived: Buffer
  try {
    derived = await scryptAsync(password, salt, expected.length, {
      N,
      r,
      p,
      maxmem: Math.max(MAX_MEM, 128 * N * r * 2),
    })
  } catch {
    return false
  }

  // مقایسهٔ زمان‌ثابت — طول‌ها برابرند چون از روی expected مشتق شد
  return timingSafeEqual(derived, expected)
}
