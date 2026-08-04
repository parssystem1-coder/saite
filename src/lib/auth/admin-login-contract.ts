/**
 * قرارداد مشترک بین فرم ورود (کلاینت) و Route Handler (سرور).
 *
 * ── چرا فایل جداگانه؟ ─────────────────────────────────────────
 * این ماژول از **هر دو طرف** ایمپورت می‌شود، پس نباید هیچ چیز
 * حساسی داشته باشد — نه رمز، نه کلید، نه `server-only`.
 *
 * فقط شکل درخواست و پاسخ اینجاست. رمز در
 * `lib/auth/server/admin-secret.ts` است که با `import 'server-only'`
 * محافظت شده و اگر کلاینت آن را ایمپورت کند بیلد می‌شکند.
 */

/**
 * مسیر Route Handler ورود مدیر.
 *
 * ── چرا زیر `/admin` و نه `/api/admin`؟ ───────────────────────
 * کوکی نشست با `Path=/admin` ست می‌شود تا در درخواست‌های فروشگاه
 * ارسال نشود. اما قانون مسیر کوکی بر اساس **پیشوند رشته‌ای** کار
 * می‌کند: مرورگر کوکی را فقط به مسیرهایی می‌فرستد که با `/admin`
 * شروع شوند.
 *
 * با مسیر `/api/admin/session` نتیجه این بود که کوکی ذخیره
 * می‌شد اما هرگز پس فرستاده نمی‌شد — یعنی خروج و بررسی وضعیت
 * بی‌صدا شکست می‌خورد. با curl تأیید شد:
 *
 *   POST /api/admin/session   → Set-Cookie ✅
 *   GET  /api/admin/session   → {"authenticated":false} ❌
 *
 * انتقال به `/admin/api/session` این را حل می‌کند بدون آنکه
 * دامنهٔ کوکی گسترده‌تر شود.
 */
export const ADMIN_LOGIN_ENDPOINT = '/admin/api/session'

/**
 * پیام خطای **یکسان** برای هر نوع شکست.
 *
 * عمداً نمی‌گوید «نام کاربری اشتباه است» یا «رمز اشتباه است».
 * تفکیک این دو به مهاجم می‌گوید کدام نام کاربری وجود دارد و
 * حملهٔ حدس رمز را هدفمند می‌کند.
 */
export const INVALID_CREDENTIALS_MESSAGE = 'نام کاربری یا رمز عبور نادرست است.'

/** پیام وقتی سرور به دلیل تلاش زیاد پاسخ نمی‌دهد */
export const RATE_LIMITED_MESSAGE =
  'تلاش‌های ناموفق بیش از حد مجاز بود. چند دقیقه بعد دوباره تلاش کنید.'

/** پیام خطای شبکه — وقتی درخواست اصلاً به سرور نرسید */
export const NETWORK_ERROR_MESSAGE =
  'ارتباط با سرور برقرار نشد. اتصال خود را بررسی کنید.'

/** حداکثر تلاش ناموفق پیش از قفل موقت فرم (سمت کلاینت) */
export const MAX_LOGIN_ATTEMPTS = 5

/** مدت قفل پس از رسیدن به سقف تلاش (میلی‌ثانیه) */
export const LOCKOUT_DURATION_MS = 60_000

/** سقف تلاش سمت سرور در بازهٔ زمانی — سخت‌گیرانه‌تر از کلاینت */
export const SERVER_RATE_LIMIT = {
  maxAttempts: 10,
  windowMs: 15 * 60_000,
} as const

/** بدنهٔ پاسخ موفق */
export interface AdminLoginSuccess {
  ok: true
}

/** بدنهٔ پاسخ ناموفق */
export interface AdminLoginFailure {
  ok: false
  message: string
}

export type AdminLoginResponse = AdminLoginSuccess | AdminLoginFailure
