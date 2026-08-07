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
 *  ۱. **متن ساده** — راحت برای توسعهٔ محلی.
 *  ۲. **هش scrypt** — با `npm run admin:hash-password`.
 *
 * تشخیص خودکار است: اگر مقدار با `scrypt.` شروع شود، به‌عنوان هش
 * تأیید می‌شود؛ وگرنه مقایسهٔ مستقیم.
 *
 * ══════════════════════════════════════════════════════════════
 *  🆕 چرا رمز پیش‌فرض حالا در production **خطا** می‌دهد
 * ══════════════════════════════════════════════════════════════
 * `saite-demo-1404` در README، در `.env.example` و در تاریخچهٔ
 * گیت یک مخزن عمومی نوشته شده. یعنی برای هر کسی که ۳۰ ثانیه وقت
 * بگذارد، رمز پنل معلوم است.
 *
 * نسخهٔ قبلی فقط با `npm run admin:check` **هشدار** می‌داد. هشدار
 * اختیاری است، و چیزی که اختیاری باشد در شب انتشار فراموش
 * می‌شود. `ADMIN_SESSION_SECRET` از همان اول درست عمل می‌کرد
 * (پرتاب خطا)؛ حالا رمز هم همان رفتار را دارد.
 *
 * ── چرا لحظهٔ بررسی اعتبارنامه و نه لحظهٔ بارگذاری ماژول؟ ──────
 * چون `next build` هم با `NODE_ENV=production` اجرا می‌شود. خطای
 * سطح ماژول یعنی بیلد در CI می‌شکند، حتی وقتی هیچ رازی لازم
 * نیست. بررسی تنبل، بیلد را سالم نگه می‌دارد و در اولین تلاش
 * ورود واقعی جلو را می‌گیرد.
 */

import {
  hashPassword,
  isPasswordHash,
  verifyPassword,
} from '@/lib/auth/server/password-hash'
import { verifyTotpCode } from '@/lib/auth/server/totp'
import { parseAdminRole } from '@/lib/auth/rbac'
import type { AdminRole, AdminUser } from '@/types/user'

const DEFAULT_ADMIN_USERNAME = 'admin'
const DEFAULT_ADMIN_PASSWORD = 'saite-demo-1404'

/** حداقل طول رمز قابل قبول در production */
const MIN_PRODUCTION_PASSWORD_LENGTH = 12

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
 * خطای پیکربندی — از خطای اعتبارنامه جداست.
 *
 * Route Handler با دیدن این، به‌جای «رمز اشتباه است» پاسخ ۵۰۳
 * می‌دهد. مدیر باید بفهمد مشکل از سرور است، نه از رمزی که زده.
 */
export class AdminConfigError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AdminConfigError'
  }
}

/**
 * دروازهٔ ایمنی production.
 *
 * در توسعه و تست هیچ کاری نمی‌کند. در production، اگر پیکربندی
 * ناامن باشد ورود را **کاملاً** می‌بندد.
 */
export function assertSafeProductionCredentials(): void {
  if (process.env.NODE_ENV !== 'production') return

  /*
    ابتدا نشت آشکار: اگر کسی نسخهٔ قدیمی متغیر را برگردانده باشد،
    رمز دوباره داخل باندل مرورگر است. این بدترین حالت ممکن است و
    باید بلندتر از بقیه فریاد بزند.
  */
  if (process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
    throw new AdminConfigError(
      'NEXT_PUBLIC_ADMIN_PASSWORD تعریف شده است. پیشوند NEXT_PUBLIC یعنی این ' +
        'مقدار داخل جاوااسکریپت مرورگر قرار می‌گیرد و برای هر بازدیدکننده ' +
        'قابل خواندن است. آن را حذف کنید و از ADMIN_PASSWORD استفاده کنید.'
    )
  }

  if (IS_USING_DEFAULT_CREDENTIALS) {
    throw new AdminConfigError(
      'اعتبارنامهٔ پیش‌فرض مدیر هنوز فعال است. این مقدار در مخزن عمومی نوشته ' +
        'شده، پس عملاً پنل بدون رمز است. ADMIN_USERNAME و ADMIN_PASSWORD را ' +
        'در .env.local تعریف کنید:  npm run admin:hash-password'
    )
  }

  if (!IS_PASSWORD_HASHED && ADMIN_PASSWORD.length < MIN_PRODUCTION_PASSWORD_LENGTH) {
    throw new AdminConfigError(
      `رمز مدیر کوتاه‌تر از ${MIN_PRODUCTION_PASSWORD_LENGTH} کاراکتر است. ` +
        'یک عبارت عبور بلندتر بگذارید یا آن را هش کنید: npm run admin:hash-password'
    )
  }
}

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

/**
 * نقش مدیر — از env `ADMIN_ROLE` خوانده می‌شود.
 *
 * ── چرا از env؟ ────────────────────────────────────────────────
 * تصمیم آگاهانه: در این نسخه هنوز جدول کاربران در دیتابیس نداریم
 * (بک‌اند واقعی هنوز نیامده). یک متغیر env ساده‌ترین راه است تا
 * ادمین دقیقاً همان نقشی را داشته باشد که سازمان می‌خواهد، بدون
 * افزودن وابستگی جدید. وقتی بک‌اند اضافه شد، این ثابت جای خود را
 * به `SELECT role FROM admins WHERE id = ?` می‌دهد.
 *
 * ── مقدار پیش‌فرض چیست؟ ────────────────────────────────────────
 * پیش‌فرض `admin` است تا فاز B تغییر شکنانه نباشد: هر deployای
 * که قبلاً کار می‌کرد، همچنان کار می‌کند و کاربر همان دسترسی کامل
 * را دارد.
 */
export const ADMIN_ROLE: AdminRole = parseAdminRole(process.env.ADMIN_ROLE)

/**
 * پروفایل مدیر پس از ورود موفق — بدون هیچ دادهٔ حساسی.
 *
 * ⚠️ نام و ایمیل عمومی‌اند و به کلاینت ارسال می‌شوند؛ نقش هم بخشی
 * از پروفایل عمومی است چون UI به آن نیاز دارد. توکن نشست هم نقش
 * را در claim خودش دارد تا route handlerها بدون خواندن env
 * تصمیم بگیرند.
 */
export const ADMIN_PROFILE: AdminUser = {
  id: 'admin-1',
  name: 'مدیر سیستم',
  email: 'admin@saite.local',
  role: ADMIN_ROLE,
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
 *
 * @throws {AdminConfigError} در production با پیکربندی ناامن
 */
export async function checkAdminCredentials(
  username: string,
  password: string,
  totpCode?: string
): Promise<CredentialCheck> {
  // پیش از هر چیز: اگر پیکربندی ناامن است، اصلاً وارد منطق نشو
  assertSafeProductionCredentials()

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
