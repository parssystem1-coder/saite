import { NextResponse } from 'next/server'
import {
  INVALID_CREDENTIALS_MESSAGE,
  RATE_LIMITED_MESSAGE,
  SERVER_RATE_LIMIT,
  TOTP_INVALID_MESSAGE,
  TOTP_REQUIRED_MESSAGE,
  type AdminLoginResponse,
} from '@/lib/auth/admin-login-contract'
import {
  AdminConfigError,
  ADMIN_PROFILE,
  checkAdminCredentials,
  IS_TOTP_ENABLED,
} from '@/lib/auth/server/admin-secret'
import {
  createAdminSession,
  destroyAdminSession,
  getAdminSession,
} from '@/lib/auth/server/admin-session'
import { getUserAgent, recordAuditEvent } from '@/lib/auth/server/audit-log'
import {
  consumeRateLimit,
  getClientKey,
  getUsernameKey,
  resetRateLimit,
  USERNAME_RATE_LIMIT,
} from '@/lib/auth/server/rate-limit'
import { adminLoginSchema } from '@/lib/schemas'

/**
 * نشست مدیر — ورود، خروج و بررسی وضعیت.
 *
 * ══════════════════════════════════════════════════════════════
 *  چرا این Route Handler وجود دارد
 * ══════════════════════════════════════════════════════════════
 * پیش از این، تأیید اعتبارنامه در مرورگر انجام می‌شد. یعنی رمز
 * داخل باندل جاوااسکریپت بود و با یک `grep` روی `.next/static`
 * پیدا می‌شد. حالا رمز هرگز از سرور خارج نمی‌شود.
 *
 * ── چرا `force-dynamic`؟ ──────────────────────────────────────
 * این مسیر به کوکی و هدر درخواست وابسته است و هرگز نباید کش شود.
 * پاسخ کش‌شدهٔ یک ورود موفق برای کاربر دیگر فاجعه است.
 *
 * ── تأخیر ثابت روی شکست ───────────────────────────────────────
 * پاسخ شکست عمداً کند است. این هم حدس خودکار را کند می‌کند و هم
 * تفاوت زمانی بین «نام کاربری وجود ندارد» و «رمز غلط است» را
 * می‌پوشاند.
 *
 * ══════════════════════════════════════════════════════════════
 *  🆕 دو تغییر امنیتی
 * ══════════════════════════════════════════════════════════════
 * ۱. **سطل دوم بر اساس نام کاربری.** سقف per-IP جلوی حملهٔ
 *    توزیع‌شده را نمی‌گیرد؛ مهاجم با ۵۰۰ پروکسی، ۵۰۰ سطل جدا
 *    می‌گیرد. جزئیات در `rate-limit.ts`.
 *
 * ۲. **بررسی Origin.** کوکی `sameSite=strict` تقریباً همهٔ CSRF
 *    را می‌بندد، اما این مسیر یک endpoint حالت‌دار است و لایهٔ
 *    دوم ارزان است. فقط وقتی هدر **وجود دارد** و نامتجانس است رد
 *    می‌کنیم — درخواست‌های بدون Origin (curl، تست، health check)
 *    دست‌نخورده می‌مانند.
 */

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * تأخیر یکسان روی هر شکست — پوشاندن اختلاف زمان.
 *
 * در تست صفر می‌شود، وگرنه هر تست rate limit که ۱۰ تلاش می‌فرستد
 * ۶ ثانیه طول می‌کشد و از سقف زمانی Vitest رد می‌شود. تأخیر بخشی
 * از رفتار امنیتی است، پس حذف نمی‌شود — فقط در تست کنار می‌رود.
 */
const FAILURE_DELAY_MS = process.env.NODE_ENV === 'test' ? 0 : 600

function delay(ms: number): Promise<void> {
  if (ms <= 0) return Promise.resolve()
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** هیچ پاسخ نشستی نباید در کش پراکسی یا مرورگر بنشیند */
function noStore<T extends NextResponse>(response: T): T {
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, private')
  return response
}

function failure(
  message: string,
  status: number,
  extra?: { totpRequired?: boolean }
): NextResponse<AdminLoginResponse> {
  return noStore(
    NextResponse.json<AdminLoginResponse>({ ok: false, message, ...extra }, { status })
  )
}

/**
 * آیا درخواست از خود سایت آمده؟
 *
 * `null` یعنی «نمی‌دانم» و اجازه می‌دهیم. فقط عدم تطابق صریح رد
 * می‌شود، وگرنه هر کلاینت غیرمرورگری را می‌شکستیم.
 */
function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin')
  if (!origin) return true

  try {
    return new URL(origin).origin === new URL(request.url).origin
  } catch {
    return false
  }
}

/**
 * `POST /admin/api/session` — ورود.
 *
 * بدنه: `{ username, password, totpCode? }`
 * پاسخ: `200 { ok: true }` + کوکی، یا `401` / `429` / `503`
 */
export async function POST(request: Request): Promise<NextResponse<AdminLoginResponse>> {
  const clientKey = getClientKey(request.headers)
  const userAgent = getUserAgent(request.headers)
  const rateLimitKey = `admin-login:${clientKey}`

  if (!isSameOrigin(request)) {
    recordAuditEvent({ event: 'login-failed', ip: clientKey, userAgent })
    return failure(INVALID_CREDENTIALS_MESSAGE, 403)
  }

  /*
    سطل IP قبل از خواندن بدنه مصرف می‌شود: اگر بعد از parse بود،
    مهاجم می‌توانست با بدنه‌های غول‌پیکر سرور را مشغول کند بدون
    اینکه شمارنده‌ای بالا برود.
  */
  const limit = consumeRateLimit(
    rateLimitKey,
    SERVER_RATE_LIMIT.maxAttempts,
    SERVER_RATE_LIMIT.windowMs
  )

  if (!limit.allowed) {
    recordAuditEvent({ event: 'login-rate-limited', ip: clientKey, userAgent })
    const response = failure(RATE_LIMITED_MESSAGE, 429)
    response.headers.set('Retry-After', String(limit.retryAfterSeconds))
    return response
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    await delay(FAILURE_DELAY_MS)
    return failure(INVALID_CREDENTIALS_MESSAGE, 400)
  }

  /*
    اعتبارسنجی با همان schema فرم.

    نکته: پیام خطای Zod به کلاینت **برگردانده نمی‌شود**. اگر
    برمی‌گشت، مهاجم می‌فهمید کدام فیلد مشکل داشته. پیام همیشه
    یکسان است.
  */
  const parsed = adminLoginSchema.safeParse(body)
  if (!parsed.success) {
    await delay(FAILURE_DELAY_MS)
    return failure(INVALID_CREDENTIALS_MESSAGE, 400)
  }

  const { username, password, totpCode } = parsed.data
  const usernameKey = getUsernameKey(username)

  /*
    سطل دوم: این حساب، از هر جای دنیا. مهاجم با botnet سطل IP را
    دور می‌زند اما این یکی مشترک است.
  */
  const accountLimit = consumeRateLimit(
    usernameKey,
    USERNAME_RATE_LIMIT.maxAttempts,
    USERNAME_RATE_LIMIT.windowMs
  )

  if (!accountLimit.allowed) {
    recordAuditEvent({
      event: 'login-rate-limited',
      ip: clientKey,
      username,
      userAgent,
    })
    await delay(FAILURE_DELAY_MS)
    const response = failure(RATE_LIMITED_MESSAGE, 429)
    response.headers.set('Retry-After', String(accountLimit.retryAfterSeconds))
    return response
  }

  let result
  try {
    result = await checkAdminCredentials(username, password, totpCode || undefined)
  } catch (error) {
    /*
      پیکربندی ناامن در production (رمز پیش‌فرض، نشت NEXT_PUBLIC).
      این «رمز اشتباه» نیست و نباید این‌طور گزارش شود، وگرنه مدیر
      ساعت‌ها دنبال رمزی می‌گردد که درست است.
    */
    if (error instanceof AdminConfigError) {
      recordAuditEvent({ event: 'login-failed', ip: clientKey, username, userAgent })
      // پیام کامل فقط در لاگ سرور؛ به کلاینت جزئیات پیکربندی نمی‌دهیم
      console.error('[admin-auth] پیکربندی ناامن:', error.message)
      return failure(
        'ورود به پنل موقتاً غیرفعال است: پیکربندی امنیتی سرور کامل نیست.',
        503
      )
    }
    throw error
  }

  if (!result.ok) {
    await delay(FAILURE_DELAY_MS)

    /*
      «کد لازم است» شکست حساب نمی‌شود.

      کاربر رمز درست داده و فقط هنوز مرحلهٔ دوم را ندیده. اگر
      اینجا لاگ شکست می‌زدیم، فهرست لاگ پر از رکوردهای بی‌معنا
      می‌شد و حملهٔ واقعی در میانشان گم می‌شد.
    */
    if (result.reason === 'totp-required') {
      return failure(TOTP_REQUIRED_MESSAGE, 401, { totpRequired: true })
    }

    if (result.reason === 'totp-invalid') {
      recordAuditEvent({ event: 'totp-failed', ip: clientKey, username, userAgent })
      return failure(TOTP_INVALID_MESSAGE, 401, { totpRequired: true })
    }

    recordAuditEvent({ event: 'login-failed', ip: clientKey, username, userAgent })
    return failure(INVALID_CREDENTIALS_MESSAGE, 401)
  }

  // ورود موفق: هر دو شمارنده آزاد می‌شوند
  resetRateLimit(rateLimitKey)
  resetRateLimit(usernameKey)
  // نقش از ADMIN_PROFILE می‌آید که خودش از ADMIN_ROLE env خوانده شده است.
  await createAdminSession(ADMIN_PROFILE.id, ADMIN_PROFILE.role)
  recordAuditEvent({ event: 'login-success', ip: clientKey, username, userAgent })

  return noStore(NextResponse.json<AdminLoginResponse>({ ok: true }))
}

/**
 * `DELETE /admin/api/session` — خروج.
 *
 * چرا لازم است؟ پاک‌کردن state کلاینت کوکی سرور را باطل نمی‌کند.
 * بدون این، کاربر «خارج شده» ولی کوکی‌اش هنوز معتبر است.
 */
export async function DELETE(request: Request): Promise<NextResponse<AdminLoginResponse>> {
  if (!isSameOrigin(request)) {
    return failure(INVALID_CREDENTIALS_MESSAGE, 403)
  }

  await destroyAdminSession()
  recordAuditEvent({
    event: 'logout',
    ip: getClientKey(request.headers),
    userAgent: getUserAgent(request.headers),
  })
  return noStore(NextResponse.json<AdminLoginResponse>({ ok: true }))
}

/**
 * `GET /admin/api/session` — وضعیت نشست فعلی.
 *
 * فقط پروفایل عمومی برمی‌گرداند؛ هیچ بخشی از توکن یا رمز.
 * `totpEnabled` برای فرم ورود است تا بداند فیلد کد را نشان دهد.
 */
export async function GET(): Promise<NextResponse> {
  const admin = await getAdminSession()
  if (!admin) {
    return noStore(
      NextResponse.json(
        { authenticated: false, totpEnabled: IS_TOTP_ENABLED },
        { status: 401 }
      )
    )
  }
  return noStore(
    NextResponse.json({ authenticated: true, admin, totpEnabled: IS_TOTP_ENABLED })
  )
}
