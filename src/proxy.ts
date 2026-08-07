import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import {
  ADMIN_SESSION_COOKIE,
  verifyAdminSessionToken,
} from '@/lib/auth/server/session-token'
import {
  buildAdminHeaders,
  generateNonce,
  NONCE_HEADER,
} from '@/lib/security-headers'

/**
 * پروکسی (middleware) — گارد ادمین + تزریق nonce برای CSP ادمین.
 *
 * ══════════════════════════════════════════════════════════════
 *  چرا نام فایل `proxy.ts` است و نه `middleware.ts`
 * ══════════════════════════════════════════════════════════════
 * در Next.js 16 قرارداد `middleware` **منسوخ** شده و به `proxy`
 * تغییر نام داده. این فقط تغییر نام نیست — اگر فایل را
 * `middleware.ts` بگذارید، در این نسخه هشدار منسوخ‌شدگی می‌گیرید و
 * در نسخه‌های بعدی **بی‌صدا نادیده گرفته می‌شود**؛ یعنی گارد اجرا
 * نمی‌شود و پنل باز می‌ماند بدون هیچ خطایی.
 *
 * تأیید در همین مخزن:
 *   node_modules/next/dist/build/index.js:651
 *   → 'The "middleware" file convention is deprecated.
 *      Please use "proxy" instead.'
 *
 * ══════════════════════════════════════════════════════════════
 *  این لایه به‌تنهایی مرز امنیتی نیست
 * ══════════════════════════════════════════════════════════════
 * CVE-2025-29927 دقیقاً همین را نشان داد: با یک هدر ساخته‌شده
 * می‌شد اجرای middleware را دور زد و هر گارد مبتنی بر آن از کار
 * می‌افتاد.
 *
 * درس معماری: این لایه «دروازهٔ اول» است — سریع، ارزان، جلوی
 * دسترسی تصادفی را می‌گیرد. اما تصمیم نهایی باید جای دیگری هم
 * گرفته شود. به همین دلیل:
 *
 *   ۱. اینجا  → ریدایرکت زودهنگام، بدون رندر شدن صفحه
 *   ۲. AdminGuard → جلوگیری از پرش صفحه در ناوبری کلاینتی
 *   ۳. getAdminSession() در هر Route Handler → تصمیم واقعی
 *
 * هیچ‌کدام جای دیگری را نمی‌گیرد.
 *
 * ── چرا فقط توکن را تأیید می‌کند؟ ─────────────────────────────
 * طبق راهنمای Next.js، این لایه نباید به دیتابیس بزند یا منطق
 * سنگین اجرا کند. اینجا فقط امضای HMAC و انقضا بررسی می‌شود که
 * محاسبهٔ محلی و سریع است.
 *
 * ══════════════════════════════════════════════════════════════
 *  🆕 فاز D — CSP سختگیرانه برای /admin با nonce+strict-dynamic
 * ══════════════════════════════════════════════════════════════
 * قبلاً همهٔ CSP از `next.config.headers()` می‌آمد و برای هر
 * مسیر یکسان بود — یعنی مجبور بودیم `'unsafe-inline'` نگه داریم
 * چون صفحات public استاتیک با nonce سازگار نبودند.
 *
 * تصمیم فاز D: **دو CSP، هر کدام مناسب مصرف خودش.**
 *   • صفحات public (کاتالوگ، مقاله، …) → CSP از `next.config`
 *     بدون nonce ولی با همهٔ محدودیت‌های سختگیرانهٔ دیگر
 *     (frame-ancestors 'none'، form-action 'self'، …)
 *   • مسیرهای /admin → این proxy CSP سختگیرتر با
 *     nonce+strict-dynamic می‌سازد
 *
 * چرا این تفکیک: /admin همیشه dynamic است (کوکی، no-store) پس
 * nonce یکتای هر درخواست هیچ هزینه‌ای اضافه نمی‌کند — و ارزش
 * دفاعی بالاست چون پنل هدف اصلی حملهٔ XSS است. صفحات public
 * اسکریپت inline خودمان ندارند (فقط JSON-LD که data-script است
 * و از CSP script-src مستثنی است)، پس ریسک XSS نسبتاً کم و
 * هزینهٔ dynamic-سازی بی‌جهت است.
 *
 * ── چرا nonce را در هدر داخلی می‌گذاریم؟ ──────────────────────
 * `NextResponse.next({ request: { headers } })` اجازه می‌دهد یک
 * هدر جدید به درخواست اضافه کنیم که Server Componentها با
 * `headers()` بخوانند. این تنها راه پاس دادن مقدار از middleware
 * به رندر است.
 */

/**
 * مسیرهایی که داخل `/admin` هستند اما نباید گارد شوند.
 *
 * `/admin/api/session` عمداً اینجاست: خودِ endpoint ورود است، پس
 * اگر گارد می‌شد هیچ‌کس نمی‌توانست وارد شود (حلقهٔ بسته). امنیت
 * آن با تأیید اعتبارنامه و rate limit داخل خودش تأمین می‌شود، نه
 * با این لایه.
 */
const PUBLIC_ADMIN_PATHS = ['/admin/login', '/admin/recover', '/admin/api/session']

function isPublicAdminPath(pathname: string): boolean {
  return PUBLIC_ADMIN_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  )
}

/**
 * اعمال هدرهای امنیتی ادمین (شامل CSP با nonce) روی پاسخ.
 *
 * جدا نگه داشتن این تابع تا هم مسیر «عبور موفق» و هم مسیر
 * «ریدایرکت» بتوانند از آن استفاده کنند — بدون تکرار کد.
 */
function applyAdminHeaders(response: NextResponse, nonce: string): NextResponse {
  const isDev = process.env.NODE_ENV !== 'production'
  const headers = buildAdminHeaders(isDev, nonce)
  for (const { key, value } of headers) {
    response.headers.set(key, value)
  }
  return response
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl

  /*
    nonce فقط برای مسیرهای admin ساخته می‌شود. proxy روی مسیرهای
    غیرِ admin هم به‌خاطر matcher اجرا نمی‌شود.
  */
  const nonce = generateNonce()
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set(NONCE_HEADER, nonce)

  // صفحات ورود و بازیابی باید بدون نشست هم باز شوند
  if (isPublicAdminPath(pathname)) {
    const response = NextResponse.next({ request: { headers: requestHeaders } })
    return applyAdminHeaders(response, nonce)
  }

  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value
  const session = await verifyAdminSessionToken(token)

  if (session) {
    const response = NextResponse.next({ request: { headers: requestHeaders } })
    return applyAdminHeaders(response, nonce)
  }

  /*
    مقصد اصلی حفظ می‌شود تا پس از ورود کاربر به همان صفحه برگردد.
    `pathname` از خود درخواست می‌آید، پس همیشه مسیر داخلی است —
    اما فرم ورود باز هم آن را با `isAdminPath` اعتبارسنجی می‌کند.
  */
  const loginUrl = new URL('/admin/login', request.url)
  loginUrl.searchParams.set('redirect', `${pathname}${search}`)

  const response = NextResponse.redirect(loginUrl)

  // پاسخ ریدایرکت نباید کش شود — وگرنه کاربر واردشده هم آن را می‌گیرد
  response.headers.set('Cache-Control', 'no-store, must-revalidate')

  return applyAdminHeaders(response, nonce)
}

/**
 * فقط ناحیهٔ `/admin`.
 *
 * ⚠️ اگر روزی مسیر جدیدی برای پنل اضافه کردید که زیر `/admin`
 * نیست، **این matcher را هم به‌روز کنید**. تغییر matcher می‌تواند
 * بی‌صدا پوشش را بردارد؛ به همین دلیل بررسی دوم در
 * `getAdminSession()` هرگز حذف نمی‌شود.
 *
 * صفحات public از این matcher خارج‌اند و CSP خود را از
 * `next.config.headers()` می‌گیرند (سختگیرانه ولی بدون nonce).
 */
export const config = {
  matcher: ['/admin/:path*'],
}
