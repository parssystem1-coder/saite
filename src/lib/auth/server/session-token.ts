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
 * فقط سه چیز لازم داریم: شناسه، زمان انقضا و نسخهٔ ابطال. فرمت
 * زیر کافی است:
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
 *
 * ══════════════════════════════════════════════════════════════
 *  🆕 ابطال نشست — چرا claim جدید `ver` اضافه شد
 * ══════════════════════════════════════════════════════════════
 * تا پیش از این، توکن فقط `sub` و `exp` داشت. یعنی:
 *
 *   مدیر می‌فهمد رمزش لو رفته → رمز را عوض می‌کند
 *   → کوکی دزدیده‌شده **تا ۸ ساعت هنوز معتبر است**
 *
 * هیچ راهی برای «همهٔ نشست‌ها را باطل کن» وجود نداشت. حالا یک
 * اثر انگشت از پیکربندی حساب داخل توکن است و موقع تأیید مقایسه
 * می‌شود. هر تغییری در رمز، کلید امضا، کلید TOTP یا نام کاربری،
 * همهٔ توکن‌های قبلی را **فوراً** بی‌اعتبار می‌کند.
 *
 * ── چرا هش غیررمزنگاری (FNV-1a) کافی است؟ ────────────────────
 * این مقدار **راز نیست** — کل payload با HMAC امضا می‌شود، پس
 * مهاجم نمی‌تواند `ver` را دستکاری کند. تنها کاری که می‌کند
 * تشخیص «پیکربندی عوض شده» است. برای آن، هش سریع و همگام کافی
 * است و ما را از async و node:crypto داخل proxy بی‌نیاز می‌کند.
 *
 * ── ابطال دستی ────────────────────────────────────────────────
 * بدون عوض کردن رمز هم می‌شود همه را بیرون انداخت:
 *   ADMIN_SESSION_VERSION=2   (هر مقدار جدیدی)
 *
 * ⚠️ اثر جانبی مورد انتظار: با اولین deploy این تغییر، هر مدیری
 *    که الان وارد است یک‌بار به صفحهٔ ورود برمی‌گردد. توکن‌های
 *    قدیمی `ver` ندارند، پس نامعتبر شمرده می‌شوند. این درست است.
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

import { isAdminRole } from '@/lib/auth/rbac'
import type { AdminRole } from '@/types/user'

export interface AdminSessionPayload {
  /** شناسهٔ مدیر */
  sub: string
  /** زمان صدور (ثانیه) */
  iat: number
  /** زمان انقضا (ثانیه) */
  exp: number
  /** اثر انگشت پیکربندی حساب — مبنای ابطال گروهی */
  ver: string
  /**
   * 🆕 نقش مدیر — اضافه‌شده در فاز B (RBAC).
   *
   * چرا در توکن و نه در دیتابیس هر بار: چون کل هدف نشست این است
   * که یک بار سرور بگوید «این کاربر کیست» و بعد بدون رفت‌وبرگشت
   * تصمیم گرفته شود. اگر route handler هر بار می‌خواست نقش را از
   * env بخواند، هم کندتر بود و هم اگر روزی چند مدیر داشتیم مجبور
   * می‌شدیم dbای اضافه کنیم صرفاً برای همین یک مقدار.
   *
   * چون HMAC روی کل payload است، مهاجم نمی‌تواند viewer را به
   * admin تبدیل کند بدون دانستن کلید امضا.
   *
   * بازگشت‌پذیری: توکن‌های صادرشدهٔ قبلی این فیلد را ندارند و در
   * `verifyAdminSessionToken` رد می‌شوند — یعنی همه یک‌بار مجدد
   * login می‌شوند. این همان رفتار «bumpِ `ver`» است و اثر جانبی
   * قابل‌قبولی برای فاز امنیتی است.
   */
  role: AdminRole
}

/* ── نسخهٔ نشست (ابطال گروهی) ─────────────────────────────────── */

/**
 * هش FNV-1a ۳۲ بیتی.
 *
 * چرا این و نه SHA؟ چون همگام است و هیچ وابستگی ندارد؛ در
 * `proxy.ts` که باید سبک بماند هم اجرا می‌شود. امنیت از HMAC
 * می‌آید، نه از این.
 */
function fnv1a(input: string): string {
  let hash = 0x811c9dc5
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193) >>> 0
  }
  return hash.toString(36)
}

/*
  کش در سطح ماژول: مقادیر env در طول عمر process عوض نمی‌شوند و
  این تابع در هر درخواست صدا زده می‌شود.

  ⚠️ در تست باید بشود آن را پاک کرد، وگرنه تستی که env را عوض
     می‌کند مقدار بیات می‌گیرد.
*/
let cachedVersion: string | null = null

/**
 * اثر انگشت پیکربندی فعلی حساب مدیر.
 *
 * ⚠️ خودِ رمز اینجا **ذخیره نمی‌شود** — فقط هش کوتاه‌شدهٔ آن، و
 * آن هم فقط برای مقایسه. حتی اگر کسی توکن را decode کند، از این
 * ۷ کاراکتر چیزی درنمی‌آورد.
 */
export function getSessionVersion(): string {
  if (cachedVersion !== null) return cachedVersion

  const fingerprint = [
    process.env.ADMIN_SESSION_VERSION?.trim() ?? '1',
    process.env.ADMIN_USERNAME?.trim() ?? '',
    process.env.ADMIN_PASSWORD?.trim() ?? '',
    process.env.ADMIN_TOTP_SECRET?.trim() ?? '',
    process.env.ADMIN_SESSION_SECRET?.trim() ?? '',
    /*
      🆕 نقش هم بخشی از اثر انگشت است. علت: اگر مدیر تصمیم گرفت
      نقش یک اپراتور را از admin به viewer پایین بیاورد، نباید
      نشست‌های قبلی همچنان دسترسی بالا داشته باشند.
    */
    process.env.ADMIN_ROLE?.trim() ?? '',
  ].join('')

  cachedVersion = fnv1a(fingerprint)
  return cachedVersion
}

/** فقط برای تست — پاک‌کردن کش پس از تغییر متغیرهای محیطی */
export function __resetSessionVersionCache(): void {
  cachedVersion = null
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
  role: AdminRole,
  maxAgeSeconds: number = ADMIN_SESSION_MAX_AGE_SECONDS
): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  const payload: AdminSessionPayload = {
    sub: adminId,
    iat: now,
    exp: now + maxAgeSeconds,
    ver: getSessionVersion(),
    role,
  }

  const encoded = toBase64Url(new TextEncoder().encode(JSON.stringify(payload)))
  const signature = await sign(encoded)
  return `${encoded}.${signature}`
}

/**
 * تأیید توکن.
 *
 * `null` یعنی نامعتبر — چه امضا غلط باشد، چه منقضی، چه بدشکل،
 * چه از نسخهٔ پیکربندی قبلی.
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

  /*
    بررسی ابطال. توکن‌های صادرشده پیش از این تغییر `ver` ندارند و
    اینجا رد می‌شوند — یعنی یک‌بار ورود مجدد پس از deploy.
  */
  if (typeof payload.ver !== 'string') return null
  if (!timingSafeEqual(payload.ver, getSessionVersion())) return null

  /*
    🆕 بررسی نقش. توکن‌های قبل از فاز B این فیلد را ندارند و
    نامعتبر شمرده می‌شوند — همان اثر جانبی مورد انتظار: یک‌بار
    ورود مجدد پس از deploy.

    مقدار غیرمعتبر (مثلاً 'superuser') هم رد می‌شود: هرگز اعتماد
    نکن که چون توکن امضاشده، claimها هم لزوماً از انواع مورد
    انتظار هستند.
  */
  if (!isAdminRole(payload.role)) return null

  return payload
}
