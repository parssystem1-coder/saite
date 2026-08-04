import 'server-only'

import { cookies } from 'next/headers'
import { ADMIN_PROFILE } from '@/lib/auth/server/admin-secret'
import {
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_MAX_AGE_SECONDS,
  createAdminSessionToken,
  verifyAdminSessionToken,
} from '@/lib/auth/server/session-token'
import type { AdminUser } from '@/types/user'

/**
 * خواندن و نوشتن نشست مدیر روی کوکی — تنها منبع حقیقت.
 *
 * ── چرا httpOnly؟ ─────────────────────────────────────────────
 * نشست قبلی در `localStorage` بود، یعنی هر اسکریپتی روی صفحه
 * می‌توانست بخواندش. یک XSS در فروشگاه (مثلاً از طریق یک
 * وابستگی آلوده) کافی بود تا نشست مدیر دزدیده شود.
 *
 * کوکی `httpOnly` از دسترس `document.cookie` خارج است.
 *
 * ── چرا sameSite=strict؟ ──────────────────────────────────────
 * `lax` اجازه می‌دهد کوکی در ناوبری سطح-بالا (کلیک روی لینک از
 * سایت دیگر) ارسال شود. برای پنل مدیریت این را نمی‌خواهیم: اگر
 * مدیری روی لینکی در ایمیل کلیک کند که به `/admin/products/delete`
 * اشاره دارد، `strict` جلوی ارسال کوکی را می‌گیرد.
 *
 * هزینه‌اش این است که ورود از لینک خارجی کار نمی‌کند — که برای
 * پنل مدیریت اصلاً مطلوب هم هست.
 *
 * ── چرا secure فقط در production؟ ─────────────────────────────
 * `secure` یعنی «فقط روی HTTPS بفرست». در توسعهٔ محلی روی
 * `http://localhost` این کوکی هرگز ارسال نمی‌شد و ورود کار
 * نمی‌کرد. پس در dev خاموش است و در production روشن.
 */

const isProduction = process.env.NODE_ENV === 'production'

/** ثبت نشست پس از ورود موفق */
export async function createAdminSession(adminId: string): Promise<void> {
  const token = await createAdminSessionToken(adminId)
  const cookieStore = await cookies()

  cookieStore.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    // فقط برای مسیرهای /admin ارسال می‌شود — به فروشگاه نشت نمی‌کند
    path: '/admin',
    maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
  })
}

/** ابطال نشست — کوکی بلافاصله منقضی می‌شود */
export async function destroyAdminSession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(ADMIN_SESSION_COOKIE, '', {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    path: '/admin',
    maxAge: 0,
  })
}

/**
 * مدیر واردشدهٔ فعلی، یا `null`.
 *
 * ⚠️ **این تابع را در هر Server Action و Route Handler ادمین صدا
 * بزنید.** گارد `proxy.ts` لایهٔ اول است، نه تنها لایه: اگر روزی
 * matcher عوض شود یا مسیری از قلم بیفتد، این بررسی همچنان جلوی
 * دسترسی را می‌گیرد.
 *
 * این همان درسی است که CVE-2025-29927 به اکوسیستم Next.js داد:
 * لایهٔ شبکه به‌تنهایی مرز امنیتی نیست.
 */
export async function getAdminSession(): Promise<AdminUser | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value
  const payload = await verifyAdminSessionToken(token)

  if (!payload) return null
  if (payload.sub !== ADMIN_PROFILE.id) return null

  return ADMIN_PROFILE
}

/** آیا نشست مدیر معتبری وجود دارد؟ */
export async function hasAdminSession(): Promise<boolean> {
  return (await getAdminSession()) !== null
}
