import localFont from 'next/font/local'

/**
 * فونت وزیرمتن — میزبانی محلی.
 *
 * چرا next/font/google استفاده نمی‌کنیم؟
 * چون در زمان بیلد به fonts.googleapis.com درخواست می‌زند و بیلد را در
 * محیط‌های بدون اینترنت (رانرهای ایزوله، شبکه‌های فیلترشده) می‌شکند.
 * این دقیقاً همان خطایی بود که در ممیزی مشاهده شد.
 */
export const vazirmatn = localFont({
  src: [
    { path: '../assets/fonts/vazirmatn-arabic-400-normal.woff2', weight: '400', style: 'normal' },
    { path: '../assets/fonts/vazirmatn-arabic-500-normal.woff2', weight: '500', style: 'normal' },
    { path: '../assets/fonts/vazirmatn-arabic-700-normal.woff2', weight: '700', style: 'normal' },
    { path: '../assets/fonts/vazirmatn-arabic-900-normal.woff2', weight: '900', style: 'normal' },
  ],
  variable: '--font-vazir',
  display: 'swap',
  fallback: ['system-ui', 'sans-serif'],
})
