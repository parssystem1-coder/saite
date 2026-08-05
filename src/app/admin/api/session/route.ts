import { NextResponse } from 'next/server'
import {
  INVALID_CREDENTIALS_MESSAGE,
  RATE_LIMITED_MESSAGE,
  SERVER_RATE_LIMIT,
  type AdminLoginResponse,
} from '@/lib/auth/admin-login-contract'
import { ADMIN_PROFILE, matchesAdminCredentials } from '@/lib/auth/server/admin-secret'
import {
  createAdminSession,
  destroyAdminSession,
  getAdminSession,
} from '@/lib/auth/server/admin-session'
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

function failure(message: string, status: number): NextResponse<AdminLoginResponse> {
  return NextResponse.json<AdminLoginResponse>({ ok: false, message }, { status })
}

/**
 * `POST /admin/api/session` — ورود.
 *
 * بدنه: `{ username, password }`
 * پاسخ: `200 { ok: true }` + کوکی، یا `401` / `429`
 */
export async function POST(request: Request): Promise<NextResponse<AdminLoginResponse>> {
  const clientKey = getClientKey(request.headers)

  const limit = consumeRateLimit(
    `admin-login:${clientKey}`,
    SERVER_RATE_LIMIT.maxAttempts,
    SERVER_RATE_LIMIT.windowMs
  )

  if (!limit.allowed) {
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

  const { username, password } = parsed.data

  if (!matchesAdminCredentials(username, password)) {
    await delay(FAILURE_DELAY_MS)
    return failure(INVALID_CREDENTIALS_MESSAGE, 401)
  }

  // ورود موفق: شمارندهٔ این IP آزاد می‌شود
  resetRateLimit(`admin-login:${clientKey}`)
  await createAdminSession(ADMIN_PROFILE.id)

  return NextResponse.json<AdminLoginResponse>({ ok: true })
}

/**
 * `DELETE /admin/api/session` — خروج.
 *
 * چرا لازم است؟ پاک‌کردن state کلاینت کوکی سرور را باطل نمی‌کند.
 * بدون این، کاربر «خارج شده» ولی کوکی‌اش هنوز معتبر است.
 */
export async function DELETE(): Promise<NextResponse<AdminLoginResponse>> {
  await destroyAdminSession()
  return NextResponse.json<AdminLoginResponse>({ ok: true })
}

/**
 * `GET /admin/api/session` — وضعیت نشست فعلی.
 *
 * فقط پروفایل عمومی برمی‌گرداند؛ هیچ بخشی از توکن یا رمز.
 */
export async function GET(): Promise<NextResponse> {
  const admin = await getAdminSession()
  if (!admin) {
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }
  return NextResponse.json({ authenticated: true, admin })
}
