import type { NextConfig } from 'next'
import { buildSecurityHeaders } from './src/lib/security-headers'

/**
 * پیکربندی Next.js.
 *
 * ══════════════════════════════════════════════════════════════
 *  دو-لایه هدرهای امنیتی — تصمیم فاز D
 * ══════════════════════════════════════════════════════════════
 *
 * ۱. **`headers()` اینجا** — روی صفحات public و static اعمال
 *    می‌شود. CSP بدون nonce (چون nonce یعنی dynamic اجباری، و
 *    کاتالوگ باید static بماند)، ولی همه محدودیت‌های دیگر:
 *    frame-ancestors 'none'، form-action 'self'، object-src 'none'
 *
 * ۲. **`src/proxy.ts`** — روی `/admin/*` اعمال می‌شود و CSP
 *    سختگیرانه‌تر با nonce+strict-dynamic تولید می‌کند.
 *
 * چون matcher proxy فقط `/admin/:path*` است، `headers()` روی
 * ادمین اجرا نمی‌شود (Next پاسخ proxy را همان‌طور که هست پس
 * می‌فرستد و headers() فقط برای مسیرهایی است که به proxy نمی‌روند
 * — و اگر یک مسیر هم به proxy برود هم به headers، آخری برنده
 * است، در اینجا proxy است چون بعد از headers اجرا می‌شود).
 *
 * ── چرا `X-Robots-Tag` روی /admin در headers() نیست ──────────
 * چون proxy روی /admin آن را در `buildAdminHeaders` قرار می‌دهد.
 * دو جا نگذاشتن یعنی تنها منبع حقیقت هر هدر ادمین، proxy است.
 */
const nextConfig: NextConfig = {
  output: 'standalone',

  // هدر `X-Powered-By: Next.js` نسخهٔ فریم‌ورک را لو می‌دهد
  poweredByHeader: false,

  images: {
    // فرمت‌های مدرن — مرورگر سازگار AVIF/WebP می‌گیرد، بقیه JPEG/PNG
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
    /*
      SVG از منبع خارجی می‌تواند اسکریپت داشته باشد. صریح خاموشش
      می‌کنیم تا اگر روزی کسی remotePattern اضافه کرد، این در
      پیش‌فرض امن بماند.
    */
    dangerouslyAllowSVG: false,
  },

  async headers() {
    return [
      {
        /*
          همه به‌جز فایل‌های داخلی Next. الگوی منفی لازم است چون
          افزودن هدر به `/_next/static` کش CDN را بی‌جهت سنگین
          می‌کند.

          proxy روی /admin اجرا می‌شود و هدرهای خودش را می‌گذارد؛
          روی مسیرهای دیگر، این هدرها اعمال می‌شوند.
        */
        source: '/:path((?!_next/static).*)',
        headers: buildSecurityHeaders(undefined, undefined, { allowAnalytics: true }),
      },
    ]
  },
}

export default nextConfig
