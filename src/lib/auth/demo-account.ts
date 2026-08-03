import type { UserRole } from '@/types/user'

/**
 * نقش‌دهی در فاز mock.
 *
 * ⚠️ این فایل «احراز هویت» نیست — فقط تعیین می‌کند حساب آزمایشی
 * با چه نقشی ساخته شود تا بتوان مسیرهای نقش‌محور (مثل /admin) را
 * بدون بک‌اند آزمود.
 *
 * ── فاز بک‌اند ────────────────────────────────────────────────
 * کل این ماژول حذف می‌شود. نقش باید از پاسخ سرور (session/JWT)
 * بیاید و هرگز از ورودی کاربر استنتاج نشود.
 */

/** ایمیل نمایشی که نقش مدیر می‌گیرد */
export const DEMO_ADMIN_EMAIL = 'admin@saite.example.com'

/**
 * نقش حساب آزمایشی را از روی ایمیل تعیین می‌کند.
 * مقایسه بدون حساسیت به بزرگی/کوچکی حروف و فضای اضافه.
 */
export function resolveDemoRole(email: string): UserRole {
  return email.trim().toLowerCase() === DEMO_ADMIN_EMAIL ? 'admin' : 'user'
}
