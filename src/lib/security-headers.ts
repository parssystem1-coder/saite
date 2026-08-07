/**
 * هدرهای امنیتی HTTP — تنها منبع حقیقت.
 *
 * ══════════════════════════════════════════════════════════════
 *  چرا این فایل جدا از next.config.ts است
 * ══════════════════════════════════════════════════════════════
 * `next.config.ts` قابل تست واحد نیست: Next آن را در زمان بیلد
 * می‌خواند، نه در زمان اجرا. اگر یک روز کسی `frame-ancestors` را
 * حذف کند، هیچ تستی قرمز نمی‌شود.
 *
 * با بیرون کشیدن منطق به یک ماژول خالص، `tests/lib/security-headers.test.ts`
 * می‌تواند تک‌تک دستورها را بررسی کند و حذف تصادفی، بیلد را قرمز
 * می‌کند.
 *
 * ══════════════════════════════════════════════════════════════
 *  🆕 فاز D — CSP با nonce و strict-dynamic
 * ══════════════════════════════════════════════════════════════
 * تا پیش از این، `script-src 'unsafe-inline'` بود که یعنی هر
 * <script>ی که XSS تزریق کند اجرا می‌شود. حالا:
 *
 *   ۱. `proxy.ts` روی هر درخواست یک nonce تصادفی می‌سازد
 *   ۲. آن را در هدر داخلی `x-nonce` می‌گذارد تا Server Componentها
 *      بتوانند بخوانند و روی <script>های inline خودشان بگذارند
 *   ۳. `Content-Security-Policy` با `'nonce-{value}' 'strict-dynamic'`
 *      ساخته می‌شود
 *
 * ── چرا `'strict-dynamic'`؟ ──────────────────────────────────
 * Next.js چند اسکریپت مجاز (chunks/hydration) را با inline
 * loader صدا می‌زند. با nonce روی اسکریپت اولیه و `'strict-dynamic'`،
 * اسکریپت‌های load شده توسط آن هم مجاز می‌شوند بدون آنکه لازم
 * باشد کل مسیرها را در `script-src` لیست کنیم.
 *
 * ── چرا `'unsafe-inline'` هنوز به‌عنوان fallback هست؟ ────────
 * مرورگرهای مدرن با دیدن `'strict-dynamic'` این را نادیده
 * می‌گیرند. اما مرورگرهای قدیمی (Safari <15.4) که
 * `'strict-dynamic'` را نمی‌فهمند، از `'unsafe-inline'` استفاده
 * می‌کنند تا سایت نشکند. این توصیهٔ رسمی MDN و Google است.
 *
 * ── هزینهٔ عملکردی ─────────────────────────────────────────────
 * nonce یعنی هر پاسخ یکتا می‌شود، پس نمی‌تواند static باشد.
 * چون proxy روی همهٔ مسیرها اجرا می‌شود، صفحات کاتالوگ و مقاله
 * که قبلاً استاتیک بودند حالا داینامیک می‌شوند. برای این پروژه
 * مشکل نیست — کاتالوگ کوچک است و CDN جلوی سرور می‌تواند
 * `Vary: Cookie` را کش کند. اگر یک روز مسئله شد، `next.config`
 * می‌تواند مسیرهای عمومی را از proxy مستثنی کند (matcher).
 */

export interface HttpHeader {
  key: string
  value: string
}

/** میزبان‌هایی که تصویر از آن‌ها مجاز است — با next.config هم‌راستا بماند */
const IMAGE_HOSTS = ['https://images.unsplash.com']

/**
 * پایهٔ API خارجی، اگر تعریف شده باشد.
 *
 * بدون این، وقتی `NEXT_PUBLIC_USE_MOCK=false` شود و بک‌اند روی
 * دامنهٔ دیگری باشد، CSP همهٔ fetchها را بی‌صدا مسدود می‌کند و
 * دیباگش کابوس است.
 */
function externalApiOrigin(): string[] {
  const raw = process.env.NEXT_PUBLIC_API_BASE_URL?.trim()
  if (!raw) return []
  try {
    return [new URL(raw).origin]
  } catch {
    return []
  }
}

/**
 * ساخت رشتهٔ Content-Security-Policy.
 *
 * @param isDev — در توسعه، unsafe-eval برای Fast Refresh لازم است
 * @param nonce — اگر تعریف شود، script-src از nonce+strict-dynamic
 *                استفاده می‌کند (فاز D). اگر undefined باشد،
 *                فقط 'unsafe-inline' — همان رفتار قبل از فاز D.
 */
export function buildContentSecurityPolicy(
  isDev = process.env.NODE_ENV !== 'production',
  nonce?: string
): string {
  /*
    ── script-src ────────────────────────────────────────────────
    اگر nonce داریم: nonce + strict-dynamic + unsafe-inline (fallback)
    اگر نداریم: نسخهٔ سنتی — unsafe-inline

    مرورگر مدرن با strict-dynamic، unsafe-inline را نادیده می‌گیرد
    و فقط اسکریپت‌هایی با nonce (یا loaded توسط آن‌ها) را اجرا می‌کند.
    مرورگر قدیمی هر دو را نادیده می‌گیرد و روی unsafe-inline fallback
    می‌کند — که رفتار قبل از فاز D بود.
  */
  const scriptSrc: string[] = ["'self'"]
  if (nonce) {
    scriptSrc.push(`'nonce-${nonce}'`)
    scriptSrc.push("'strict-dynamic'")
    // fallback برای مرورگرهایی که strict-dynamic را نمی‌فهمند
    scriptSrc.push("'unsafe-inline'")
  } else {
    // مسیر بدون nonce (مثلاً وقتی proxy اجرا نشده) — همان قدیمی
    scriptSrc.push("'unsafe-inline'")
  }
  if (isDev) {
    // eval فقط برای Fast Refresh در توسعه لازم است
    scriptSrc.push("'unsafe-eval'")
  }

  const directives: Record<string, string[]> = {
    'default-src': ["'self'"],
    // جلوگیری از تزریق <base href> که مسیر همهٔ اسکریپت‌ها را عوض می‌کند
    'base-uri': ["'self'"],
    // Flash/applet — هیچ کاربردی ندارند و سطح حمله‌اند
    'object-src': ["'none'"],
    // معادل مدرن X-Frame-Options: هیچ سایتی نمی‌تواند ما را iframe کند
    'frame-ancestors': ["'none'"],
    // فرم فقط به خودمان post می‌شود — جلوی سرقت اطلاعات فرم لاگین
    'form-action': ["'self'"],
    'frame-src': ["'none'"],
    'script-src': scriptSrc,
    // Tailwind و framer-motion استایل inline تولید می‌کنند
    'style-src': ["'self'", "'unsafe-inline'"],
    'img-src': ["'self'", 'data:', 'blob:', ...IMAGE_HOSTS],
    'font-src': ["'self'", 'data:'],
    'connect-src': isDev
      ? // websocket برای hot reload
        ["'self'", 'ws:', 'wss:', ...externalApiOrigin()]
      : ["'self'", ...externalApiOrigin()],
    'manifest-src': ["'self'"],
    'media-src': ["'self'"],
    'worker-src': ["'self'", 'blob:'],
  }

  const parts = Object.entries(directives).map(([name, values]) =>
    values.length > 0 ? `${name} ${values.join(' ')}` : name
  )

  // در توسعه روی http کار می‌کنیم؛ این دستور همه‌چیز را می‌شکند
  if (!isDev) parts.push('upgrade-insecure-requests')

  return parts.join('; ')
}

/**
 * هدرهای امنیتی برای همهٔ مسیرها.
 *
 * ── چرا HSTS فقط در production؟ ───────────────────────────────
 * HSTS به مرورگر می‌گوید «دو سال آینده این دامنه را فقط با HTTPS
 * باز کن». روی `localhost` این یعنی محیط توسعهٔ شما تا دو سال
 * خراب می‌شود و پاک کردنش از کش مرورگر دردسر دارد.
 *
 * @param nonce — 🆕 فاز D: اگر تعریف شود، در CSP هم اعمال می‌شود
 */
export function buildSecurityHeaders(
  isDev = process.env.NODE_ENV !== 'production',
  nonce?: string
): HttpHeader[] {
  const headers: HttpHeader[] = [
    { key: 'Content-Security-Policy', value: buildContentSecurityPolicy(isDev, nonce) },
    // پشتیبان CSP برای مرورگرهای قدیمی که frame-ancestors را نمی‌فهمند
    { key: 'X-Frame-Options', value: 'DENY' },
    // جلوگیری از حدس نوع فایل — پایهٔ حملهٔ آپلود تصویرِ حاوی اسکریپت
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    {
      key: 'Permissions-Policy',
      value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()',
    },
    { key: 'X-DNS-Prefetch-Control', value: 'off' },
    // جداسازی context مرورگر — جلوی حملات cross-window
    { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
    { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
  ]

  if (!isDev) {
    headers.push({
      key: 'Strict-Transport-Security',
      value: 'max-age=63072000; includeSubDomains; preload',
    })
  }

  return headers
}

/**
 * هدرهای اضافی مخصوص ناحیهٔ `/admin`.
 *
 * ── چرا no-store؟ ─────────────────────────────────────────────
 * پنل مدیریت دادهٔ مشتری و سفارش نشان می‌دهد. بدون این، پراکسی
 * شرکت یا کش مرورگر ممکن است صفحهٔ یک مدیر را به دیگری بدهد.
 *
 * ── چرا noindex؟ ──────────────────────────────────────────────
 * `/admin/login` نباید در گوگل ایندکس شود. ایندکس‌شدنش عملاً
 * تبلیغ آدرس پنل برای اسکنرهای خودکار است.
 */
export function buildAdminHeaders(
  isDev = process.env.NODE_ENV !== 'production',
  nonce?: string
): HttpHeader[] {
  return [
    ...buildSecurityHeaders(isDev, nonce),
    { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, private' },
    { key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' },
  ]
}

// ═══════════════════════════════════════════════════════════════
//  🆕 nonce helpers — فاز D
// ═══════════════════════════════════════════════════════════════

/**
 * نام هدر داخلی که proxy روی درخواست می‌گذارد.
 *
 * از این هدر Server Componentها با `headers().get(NONCE_HEADER)`
 * nonce را می‌خوانند و روی هر <script> inline که تولید می‌کنند
 * می‌گذارند. Next.js خودش هم اگر این هدر روی درخواست باشد و در
 * پاسخ CSP باشد، nonce را روی scriptهای hydration اعمال می‌کند.
 */
export const NONCE_HEADER = 'x-nonce'

/**
 * تولید nonce تصادفی و امن.
 *
 * ۱۶ بایت random (۱۲۸ بیت آنتروپی) → base64 با طول ~۲۲ کاراکتر.
 * این طول توصیه‌شدهٔ MDN است — کوتاه‌تر آنتروپی کافی ندارد و
 * پیش‌بینی‌پذیر می‌شود، بلندتر بی‌دلیل هدر را چاق می‌کند.
 *
 * چرا `crypto.getRandomValues` و نه `crypto.randomUUID`:
 * UUIDv4 چند بیت را برای version/variant قربانی می‌کند، پس آنتروپی
 * مؤثرش ~۱۲۲ بیت است. برای nonce یک ثانیه‌ای فرقی نمی‌کند اما این
 * الگو انعطاف بیشتری برای هر طول دلخواه دارد.
 */
export function generateNonce(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  // base64url بدون padding — امن برای هدر HTTP
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}
