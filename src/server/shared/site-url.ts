import 'server-only'

/**
 * آدرس متمرکز سایت — تنها نقطهٔ خواندن NEXT_PUBLIC_SITE_URL.
 *
 * در production اگر تنظیم نشده باشد، throw می‌کند (fail-fast هنگام boot)
 * نه fallback خاموش به localhost که باعث ساخت لینک‌های اشتباه (مثلاً
 * callbackUrl پرداخت به localhost در production) می‌شود.
 */
export function getSiteUrl(): string {
  const url = process.env.NEXT_PUBLIC_SITE_URL
  if (!url) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('NEXT_PUBLIC_SITE_URL تنظیم نشده است')
    }
    return 'http://localhost:3000'
  }
  return url.replace(/\/+$/, '')
}
