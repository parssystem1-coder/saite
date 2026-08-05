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
  resetRateLimit,
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

function failure(
  message: string,
  status: number,
  extra?: { totpRequired?: boolean }
): NextResponse<AdminLoginResponse> {
  return NextResponse.json<AdminLoginResponse>(
    { ok: false, message, ...extra },
    { status }
  )
}

/**
 * `POST /admin/api/session` — ورود.
 *
 * بدنه: `{ username, password, totpCode? }`
 * پاسخ: `200 { ok: true }` + کوکی، یا `401` / `429`
 */
export async function POST(request: Request): Promise<NextResponse<AdminLoginResponse>> {
  const clientKey = getClientKey(request.headers)
  const userAgent = getUserAgent(request.headers)
  const rateLimitKey = `admin-login:${clientKey}`

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
  const result = await checkAdminCredentials(username, password, totpCode || undefined)

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

  // ورود موفق: شمارندهٔ این IP آزاد می‌شود
  resetRateLimit(rateLimitKey)
  await createAdminSession(ADMIN_PROFILE.id)
  recordAuditEvent({ event: 'login-success', ip: clientKey, username, userAgent })

  return NextResponse.json<AdminLoginResponse>({ ok: true })
}

/**
 * `DELETE /admin/api/session` — خروج.
 *
 * چرا لازم است؟ پاک‌کردن state کلاینت کوکی سرور را باطل نمی‌کند.
 * بدون این، کاربر «خارج شده» ولی کوکی‌اش هنوز معتبر است.
 */
export async function DELETE(request: Request): Promise<NextResponse<AdminLoginResponse>> {
  await destroyAdminSession()
  recordAuditEvent({
    event: 'logout',
    ip: getClientKey(request.headers),
    userAgent: getUserAgent(request.headers),
  })
  return NextResponse.json<AdminLoginResponse>({ ok: true })
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
    return NextResponse.json(
      { authenticated: false, totpEnabled: IS_TOTP_ENABLED },
      { status: 401 }
    )
  }
  return NextResponse.json({ authenticated: true, admin, totpEnabled: IS_TOTP_ENABLED })
}
