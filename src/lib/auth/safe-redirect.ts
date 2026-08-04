/**
 * اعتبارسنجی مقصد بازگشت پس از ورود.
 *
 * ── چرا این ماژول لازم است؟ ───────────────────────────────────
 * پیش از این، صفحهٔ ورود مستقیماً `params.get('redirect')` را به
 * `router.push` می‌داد. این یک آسیب‌پذیری **Open Redirect** است:
 *
 *   /login?redirect=https://evil.example/fake-bank
 *
 * مهاجم لینکی با دامنهٔ واقعی شما می‌سازد، کاربر آن را باور می‌کند،
 * وارد می‌شود و بلافاصله به سایت جعلی منتقل می‌شود — جایی که یک
 * صفحهٔ ورود شبیه‌سازی‌شده رمز او را می‌گیرد.
 *
 * قاعده: فقط مسیرهای **نسبی داخلی** پذیرفته می‌شوند.
 */

/** مسیر پیش‌فرض هر نقش وقتی مقصد معتبری در URL نیست */
export const DEFAULT_REDIRECT = {
  admin: '/admin',
  user: '/dashboard',
} as const

/**
 * آیا این مسیر برای ریدایرکت امن است؟
 *
 * موارد رد شده:
 *  - URL مطلق: `https://evil.com`، `//evil.com` (protocol-relative)
 *  - پروتکل‌های اجرایی: `javascript:`، `data:`، `vbscript:`
 *  - مسیر نسبی بدون `/` ابتدایی که ممکن است به دامنهٔ دیگر برود
 *  - کاراکترهای کنترلی و newline (تزریق هدر)
 */
export function isSafeRedirectPath(value: string | null | undefined): value is string {
  if (!value) return false

  const path = value.trim()
  if (path.length === 0 || path.length > 512) return false

  // کاراکتر کنترلی، newline، tab یا backslash → رد
  if (/[\u0000-\u001f\u007f\\]/.test(path)) return false

  // باید با یک اسلش شروع شود اما نه دو تا (//host یعنی دامنهٔ خارجی)
  if (!path.startsWith('/')) return false
  if (path.startsWith('//')) return false

  // `/\evil.com` در بعضی مرورگرها مثل `//evil.com` رفتار می‌کند
  if (path.startsWith('/\\')) return false

  // هر چیزی شبیه scheme پیش از مسیر
  if (/^\/[a-z][a-z0-9+.-]*:/i.test(path)) return false

  return true
}

/**
 * مقصد امن را برمی‌گرداند؛ در غیر این صورت مسیر پیش‌فرض نقش.
 *
 * @param requested مقدار خام از query string
 * @param fallback مسیر پیش‌فرض اگر مقدار نامعتبر بود
 */
export function resolveSafeRedirect(
  requested: string | null | undefined,
  fallback: string
): string {
  return isSafeRedirectPath(requested) ? requested : fallback
}

/** آیا مقصد درخواستی داخل پنل مدیریت است؟ */
export function isAdminPath(path: string | null | undefined): boolean {
  if (!isSafeRedirectPath(path)) return false
  return path === '/admin' || path.startsWith('/admin/')
}
