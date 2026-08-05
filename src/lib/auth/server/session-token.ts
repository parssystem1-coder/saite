import 'server-only'

/**
 * توکن نشست مدیر — امضاشده با HMAC-SHA256.
 *
 * ══════════════════════════════════════════════════════════════
 *  چرا امضا لازم است
 * ══════════════════════════════════════════════════════════════
 * کوکی `httpOnly` جلوی خواندن با جاوااسکریپت را می‌گیرد، اما
 * کاربر همچنان می‌تواند با DevTools یا curl **مقدار دلخواه**
 * بفرستد. اگر کوکی فقط `admin=true` بود، هر کسی می‌توانست آن را
 * دستی بسازد و وارد پنل شود.
 *
 * امضا این را می‌بندد: سرور محتوا را با کلید مخفی HMAC می‌کند و
 * موقع خواندن دوباره محاسبه می‌کند. بدون دانستن کلید، جعل ممکن
 * نیست.
 *
 * ── چرا JWT نه؟ ───────────────────────────────────────────────
 * JWT برای این کار بیش از حد است و یک وابستگی جدید می‌آورد. ما
 * فقط دو چیز لازم داریم: شناسه و زمان انقضا. فرمت زیر کافی است:
 *
 *   base64url(payload) + "." + base64url(hmac)
 *
 * این عمداً **شبیه** JWT است اما JWT نیست — تا کسی وسوسه نشود
 * الگوریتم `none` یا claimهای پیچیده اضافه کند.
 *
 * ── چرا Web Crypto و نه node:crypto؟ ──────────────────────────
 * همین ماژول باید در `proxy.ts` هم قابل استفاده باشد. Web Crypto
 * (`globalThis.crypto.subtle`) در هر دو محیط Node و Edge کار
 * می‌کند، پس منطق تأیید یک نسخه بیشتر ندارد.
 */

/** طول عمر نشست مدیر — کوتاه‌تر از نشست مشتری، عمداً */
export const ADMIN_SESSION_MAX_AGE_SECONDS = 60 * 60 * 8 // ۸ ساعت

/** نام کوکی — پیشوند `__Host-` در production امنیت بیشتری می‌دهد */
export const ADMIN_SESSION_COOKIE = 'saite_admin_session'

const DEV_FALLBACK_SECRET = 'saite-dev-only-session-secret-do-not-use-in-production'

/**
 * کلید امضا.
 *
 * در production باید `ADMIN_SESSION_SECRET` تعریف شده باشد. اگر
 * نبود، همهٔ نشست‌ها با کلید عمومی امضا می‌شوند که یعنی هر کسی که
 * سورس را دیده می‌تواند کوکی جعل کند — پس در آن حالت بیلد باید
 * سر و صدا کند، نه بی‌صدا رد شود.
 */
function getSecret(): string {
  const fromEnv = process.env.ADMIN_SESSION_SECRET?.trim()
  if (fromEnv && fromEnv.length >= 16) return fromEnv

  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'ADMIN_SESSION_SECRET تعریف نشده یا کوتاه‌تر از ۱۶ کاراکتر است. ' +
        'بدون آن، توکن نشست مدیر قابل جعل است. یک مقدار تصادفی بسازید: ' +
        'openssl rand -base64 32'
    )
  }

  return DEV_FALLBACK_SECRET
}

export interface AdminSessionPayload {
  /** شناسهٔ مدیر */
  sub: string
  /** زمان صدور (ثانیه) */
  iat: number
  /** زمان انقضا (ثانیه) */
  exp: number
}

/* ── کدگذاری base64url بدون وابستگی ──────────────────────────── */

function toBase64Url(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(value: string): Uint8Array {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/')
  const binary = atob(padded.padEnd(Math.ceil(padded.length / 4) * 4, '='))
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

async function sign(data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(getSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data))
  return toBase64Url(new Uint8Array(signature))
}

/**
 * مقایسهٔ زمان‌ثابت دو امضا.
 *
 * اینجا برخلاف رمز، محافظت واقعاً معنا دارد: مهاجم می‌تواند
 * میلیون‌ها بار امضا بفرستد و از اختلاف زمان پاسخ، بایت‌به‌بایت
 * امضای درست را بسازد.
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return diff === 0
}

/** ساخت توکن امضاشده برای یک مدیر */
export async function createAdminSessionToken(
  adminId: string,
  maxAgeSeconds: number = ADMIN_SESSION_MAX_AGE_SECONDS
): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  const payload: AdminSessionPayload = {
    sub: adminId,
    iat: now,
    exp: now + maxAgeSeconds,
  }

  const encoded = toBase64Url(new TextEncoder().encode(JSON.stringify(payload)))
  const signature = await sign(encoded)
  return `${encoded}.${signature}`
}

/**
 * تأیید توکن.
 *
 * `null` یعنی نامعتبر — چه امضا غلط باشد، چه منقضی، چه بدشکل.
 * عمداً تفکیک نمی‌کند تا پیام خطا اطلاعاتی ندهد.
 */
export async function verifyAdminSessionToken(
  token: string | undefined | null
): Promise<AdminSessionPayload | null> {
  if (!token) return null

  const parts = token.split('.')
  if (parts.length !== 2) return null

  const [encoded, signature] = parts
  if (!encoded || !signature) return null

  let expected: string
  try {
    expected = await sign(encoded)
  } catch {
    return null
  }

  if (!timingSafeEqual(signature, expected)) return null

  let payload: AdminSessionPayload
  try {
    payload = JSON.parse(new TextDecoder().decode(fromBase64Url(encoded)))
  } catch {
    return null
  }

  if (typeof payload?.sub !== 'string' || typeof payload?.exp !== 'number') return null
  if (payload.exp * 1000 <= Date.now()) return null

  return payload
}
