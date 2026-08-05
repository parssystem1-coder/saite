import 'server-only'

/**
 * اعتبارنامهٔ مدیر — **فقط سمت سرور**.
 *
 * ══════════════════════════════════════════════════════════════
 *  چرا این فایل وجود دارد
 * ══════════════════════════════════════════════════════════════
 * تا پیش از این، تأیید رمز در مرورگر اجرا می‌شد و رمز داخل باندل
 * جاوااسکریپت قرار می‌گرفت. اثبات عینی روی کد قبلی:
 *
 *   npm run build
 *   grep -rl "saite-demo-1404" .next/static
 *   → .next/static/chunks/3e9hd4ipezm--.js
 *
 * ── نقش `import 'server-only'` ────────────────────────────────
 * نگهبان زمان-بیلد. اگر کسی این ماژول را از یک Client Component
 * ایمپورت کند، بیلد **می‌شکند**. پس نشت دوباره با کامپایلر
 * جلوگیری می‌شود، نه با بازبینی کد.
 *
 * ══════════════════════════════════════════════════════════════
 *  دو حالت رمز: متن ساده و هش
 * ══════════════════════════════════════════════════════════════
 * `ADMIN_PASSWORD` می‌تواند یکی از این دو باشد:
 *
 *  ۱. **متن ساده** — راحت برای توسعهٔ محلی. اگر کسی به فایل
 *     `.env.local` دسترسی پیدا کند، رمز را می‌بیند.
 *
 *  ۲. **هش scrypt** — با `npm run admin:hash-password` ساخته
 *     می‌شود. رشته با `scrypt.` شروع می‌شود و از رویش نمی‌توان
 *     رمز را بازیابی کرد.
 *
 * تشخیص خودکار است: اگر مقدار با `scrypt.` شروع شود، به‌عنوان هش
 * تأیید می‌شود؛ وگرنه مقایسهٔ مستقیم.
 *
 * چرا هر دو پشتیبانی می‌شوند؟ چون اجبار به هش کردن در فاز توسعه،
 * راه‌اندازی را کند می‌کند بدون آنکه چیزی اضافه کند — رمز نمایشی
 * که در مستندات هم نوشته شده، هش کردنش معنا ندارد. اما برای
 * انتشار، `npm run admin:check` هشدار می‌دهد.
 */

import {
  hashPassword,
  isPasswordHash,
  verifyPassword,
} from '@/lib/auth/server/password-hash'
import { verifyTotpCode } from '@/lib/auth/server/totp'
import type { AdminUser } from '@/types/user'

const DEFAULT_ADMIN_USERNAME = 'admin'
const DEFAULT_ADMIN_PASSWORD = 'saite-demo-1404'

/** نام کاربری مدیر — فقط از محیط سرور */
export const ADMIN_USERNAME =
  process.env.ADMIN_USERNAME?.trim() || DEFAULT_ADMIN_USERNAME

/**
 * رمز مدیر یا هش آن — فقط از محیط سرور.
 *
 * ⚠️ این مقدار را هرگز به کلاینت نفرستید. صفحهٔ ورود در حالت
 * توسعه آن را در HTML سرور رندر می‌کند که با `NODE_ENV=production`
 * حذف می‌شود.
 */
export const ADMIN_PASSWORD =
  process.env.ADMIN_PASSWORD?.trim() || DEFAULT_ADMIN_PASSWORD

/** آیا رمز به‌صورت هش ذخیره شده؟ */
export const IS_PASSWORD_HASHED = isPasswordHash(ADMIN_PASSWORD)

/**
 * کلید TOTP — اگر تعریف شود، ورود دومرحله‌ای **اجباری** می‌شود.
 *
 * عمداً «اختیاری برای فعال‌سازی، اجباری پس از فعال‌سازی» است:
 * اگر کاربر بتواند در فرم ورود از آن رد شود، هیچ محافظتی اضافه
 * نکرده‌ایم.
 */
export const ADMIN_TOTP_SECRET = process.env.ADMIN_TOTP_SECRET?.trim() || ''

/** آیا ورود دومرحله‌ای فعال است؟ */
export const IS_TOTP_ENABLED = ADMIN_TOTP_SECRET.length > 0

/**
 * آیا اعتبارنامه هنوز مقدار پیش‌فرض است؟ — برای هشدار در UI.
 *
 * خود این مقدار بولین است، نه رمز؛ ارسالش به کلاینت نشت نیست.
 */
export const IS_USING_DEFAULT_CREDENTIALS =
  ADMIN_USERNAME === DEFAULT_ADMIN_USERNAME && ADMIN_PASSWORD === DEFAULT_ADMIN_PASSWORD

/**
 * مقایسهٔ زمان‌ثابت رشته‌ها.
 *
 * مقایسهٔ معمولی (`===`) به‌محض اولین کاراکتر متفاوت خارج می‌شود،
 * پس مدت اجرا اطلاعات لو می‌دهد. حالا که این کد روی سرور است،
 * این محافظت واقعاً معنا دارد.
 */
function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return diff === 0
}

/** پروفایل مدیر پس از ورود موفق — بدون هیچ دادهٔ حساسی */
export const ADMIN_PROFILE: AdminUser = {
  id: 'admin-1',
  name: 'مدیر سیستم',
  email: 'admin@saite.local',
  role: 'admin',
}

/** نتیجهٔ تفکیک‌شدهٔ تأیید — تا Route Handler بداند چه پاسخی بدهد */
export type CredentialCheck =
  | { ok: true }
  | { ok: false; reason: 'credentials' }
  | { ok: false; reason: 'totp-required' }
  | { ok: false; reason: 'totp-invalid' }

/**
 * بررسی اعتبارنامه — **فقط روی سرور**.
 *
 * نام کاربری بدون حساسیت به حروف بزرگ/کوچک و فاصله بررسی می‌شود،
 * اما رمز دقیقاً تطبیق داده می‌شود.
 *
 * ── ترتیب بررسی عمدی است ──────────────────────────────────────
 * نام کاربری و رمز **همیشه اول** بررسی می‌شوند. اگر TOTP اول
 * می‌آمد، مهاجم می‌توانست بدون دانستن رمز بفهمد کد دومرحله‌ای
 * درست است یا نه.
 */
export async function checkAdminCredentials(
  username: string,
  password: string,
  totpCode?: string
): Promise<CredentialCheck> {
  const normalized = username.trim().toLowerCase()
  const usernameOk = safeCompare(normalized, ADMIN_USERNAME.toLowerCase())

  const passwordOk = IS_PASSWORD_HASHED
    ? await verifyPassword(password, ADMIN_PASSWORD)
    : safeCompare(password, ADMIN_PASSWORD)

  // هر دو جداگانه ارزیابی می‌شوند تا خروج زودهنگام نداشته باشیم
  if (!usernameOk || !passwordOk) {
    return { ok: false, reason: 'credentials' }
  }

  if (!IS_TOTP_ENABLED) {
    return { ok: true }
  }

  if (!totpCode) {
    return { ok: false, reason: 'totp-required' }
  }

  if (!verifyTotpCode(ADMIN_TOTP_SECRET, totpCode)) {
    return { ok: false, reason: 'totp-invalid' }
  }

  return { ok: true }
}

/** بازصادرات برای اسکریپت‌های ابزار — تا مسیر ایمپورت یکی بماند */
export { hashPassword, isPasswordHash }
