import type { AuthUser } from '@/types/user'

/**
 * اعتبارنامهٔ ورود مدیر — **فقط فاز پوسته (mock)**.
 *
 * ══════════════════════════════════════════════════════════════
 *  ⚠️  هشدار امنیتی — این فایل در فاز بک‌اند حذف می‌شود
 * ══════════════════════════════════════════════════════════════
 *
 * هر چیزی که در باندل کلاینت باشد، برای کاربر قابل خواندن است.
 * این مقادیر «رمز» نیستند؛ فقط یک کلید نمایشی‌اند تا بتوان جریان
 * ورود مدیر را بدون سرور آزمود. هرگز رمز واقعی اینجا نگذارید.
 *
 * ── چرا ورود مدیر از ورود مشتری جداست؟ ────────────────────────
 *
 *  ۱. سطح دسترسی متفاوت → سطح حملهٔ متفاوت. فرم مشتری لینک
 *     «ثبت‌نام» و «ورود با گوگل» دارد؛ هیچ‌کدام برای مدیر معنا
 *     ندارد و فقط سطح حمله را بزرگ می‌کند.
 *
 *  ۲. حساب مدیر **ثبت‌نام‌شدنی نیست**. در پنل «تنظیمات ← کاربران»
 *     ساخته می‌شود. نمایش لینک ثبت‌نام در صفحهٔ ورود مدیر، این
 *     قاعده را نقض می‌کند و کاربر را گمراه می‌کند.
 *
 *  ۳. شمارش نام کاربری (user enumeration): فرم مشتری می‌تواند
 *     بگوید «این ایمیل ثبت نشده»، اما فرم مدیر هرگز نباید تفکیک
 *     کند که نام کاربری غلط بوده یا رمز. پیام خطا باید یکسان باشد.
 *
 * ── قرارداد فاز بک‌اند ────────────────────────────────────────
 * تابع `verifyAdminCredentials` با یک فراخوانی سرور جایگزین شود:
 *
 *   POST /api/auth/admin/login   { username, password }
 *   → 200 { user }  |  401 { message }
 *
 * الزامات سمت سرور که پوسته نمی‌تواند تأمین کند:
 *   • هش رمز با bcrypt/argon2 — هرگز متن ساده
 *   • محدودیت نرخ (rate limit) روی IP و نام کاربری
 *   • قفل موقت حساب پس از N تلاش ناموفق
 *   • session کوکی‌محور با httpOnly + secure + sameSite=strict
 *   • ثبت لاگ هر ورود موفق و ناموفق (زمان، IP، عامل کاربر)
 *   • احراز هویت دومرحله‌ای (TOTP) برای نقش مدیر
 */

/** نام کاربری نمایشی مدیر در فاز پوسته */
export const DEMO_ADMIN_USERNAME = 'admin'

/** رمز نمایشی — عمداً واضح است تا کسی آن را رمز واقعی نپندارد */
export const DEMO_ADMIN_PASSWORD = 'saite-demo-1404'

/** حداکثر تلاش ناموفق پیش از قفل موقت فرم */
export const MAX_LOGIN_ATTEMPTS = 5

/** مدت قفل پس از رسیدن به سقف تلاش (میلی‌ثانیه) */
export const LOCKOUT_DURATION_MS = 60_000

/**
 * پیام خطای **یکسان** برای هر نوع شکست.
 *
 * عمداً نمی‌گوید «نام کاربری اشتباه است» یا «رمز اشتباه است».
 * تفکیک این دو به مهاجم می‌گوید کدام نام کاربری وجود دارد و
 * حملهٔ حدس رمز را هدفمند می‌کند.
 */
export const INVALID_CREDENTIALS_MESSAGE = 'نام کاربری یا رمز عبور نادرست است.'

export interface AdminCredentials {
  username: string
  password: string
}

export type AdminVerifyResult =
  | { ok: true; user: AuthUser }
  | { ok: false; message: string }

/**
 * مقایسهٔ زمان‌ثابت رشته‌ها.
 *
 * مقایسهٔ معمولی (`===`) به‌محض اولین کاراکتر متفاوت خارج می‌شود،
 * پس مدت اجرا اطلاعات لو می‌دهد. در فاز پوسته اثر عملی ندارد اما
 * الگوی درست را ثبت می‌کند تا در بک‌اند فراموش نشود.
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
 * بررسی اعتبارنامهٔ مدیر (mock).
 *
 * تأخیر مصنوعی عمدی است: هم تجربهٔ واقعی شبکه را شبیه‌سازی می‌کند
 * و هم حدس‌زدن سریع را کند می‌کند.
 */
export async function verifyAdminCredentials(
  credentials: AdminCredentials
): Promise<AdminVerifyResult> {
  await new Promise((resolve) => setTimeout(resolve, 600))

  const username = credentials.username.trim().toLowerCase()
  const usernameOk = safeCompare(username, DEMO_ADMIN_USERNAME)
  const passwordOk = safeCompare(credentials.password, DEMO_ADMIN_PASSWORD)

  // هر دو شرط جداگانه بررسی می‌شوند تا خروج زودهنگام نداشته باشیم
  if (!usernameOk || !passwordOk) {
    return { ok: false, message: INVALID_CREDENTIALS_MESSAGE }
  }

  return {
    ok: true,
    user: {
      id: 'admin-1',
      name: 'مدیر سیستم',
      email: 'admin@saite.local',
      role: 'admin',
    },
  }
}
