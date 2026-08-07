import type { NextConfig } from 'next'
import { buildAdminHeaders, buildSecurityHeaders } from './src/lib/security-headers'

/**
 * ── چرا هدرها اینجا و نه در proxy.ts ──────────────────────────
 * `proxy.ts` فقط روی مسیرهای matcher اجرا می‌شود (`/admin/:path*`).
 * هدر امنیتی باید روی **همهٔ** پاسخ‌ها بنشیند، از جمله صفحات
 * استاتیک فروشگاه که اصلاً از proxy رد نمی‌شوند.
 *
 * `headers()` در سطح Next اعمال می‌شود و این شکاف را می‌بندد.
 */
const nextConfig: NextConfig = {
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
          همه‌چیز به‌جز فایل‌های داخلی Next. الگوی منفی لازم است
          چون افزودن هدر به `/_next/static` کش CDN را بی‌جهت
          سنگین می‌کند.
        */
        source: '/:path((?!_next/static).*)',
        headers: buildSecurityHeaders(),
      },
      {
        // سخت‌گیرانه‌تر: بدون کش، بدون ایندکس
        source: '/admin/:path*',
        headers: buildAdminHeaders(),
      },
    ]
  },
}

export default nextConfig
