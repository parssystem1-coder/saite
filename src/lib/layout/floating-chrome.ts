/**
 * مسیرهایی که المان‌های شناور سراسری در آن‌ها نمایش داده نمی‌شوند.
 *
 * «المان شناور» یعنی هر چیزی که خارج از جریان صفحه روی محتوا می‌نشیند:
 * نوار مقایسه، دکمه‌های تماس (FAB) و موارد مشابه در آینده.
 *
 * چرا یک منبع واحد؟ پیش از این فقط ContactFab مسیر /admin را استثنا
 * می‌کرد و CompareBar نمی‌کرد — نتیجه: نوار مقایسه روی پنل مدیریت
 * ظاهر می‌شد. حالا هر دو از همین فهرست می‌خوانند.
 */
export const FLOATING_CHROME_HIDDEN_PREFIXES: readonly string[] = ['/admin']

/** آیا در این مسیر باید المان‌های شناور پنهان شوند؟ */
export function isFloatingChromeHidden(
  pathname: string | null | undefined,
  prefixes: readonly string[] = FLOATING_CHROME_HIDDEN_PREFIXES
): boolean {
  if (!pathname) return false
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
}
