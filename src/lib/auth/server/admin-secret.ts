import 'server-only'

/**
 * اعتبارنامهٔ مدیر — **فقط سمت سرور**.
 *
 * ══════════════════════════════════════════════════════════════
 *  چرا این فایل وجود دارد
 * ══════════════════════════════════════════════════════════════
 * تا پیش از این، `verifyAdminCredentials` در مرورگر اجرا می‌شد و
 * رمز داخل باندل جاوااسکریپت قرار می‌گرفت. اثبات عینی:
 *
 *   npm run build
 *   grep -rl "saite-demo-1404" .next/static
 *   → .next/static/chunks/3e9hd4ipezm--.js
 *
 * یعنی هر بازدیدکننده می‌توانست با Ctrl+F در سورس صفحه رمز پنل
 * مدیریت را پیدا کند. هیچ ترفند کلاینتی این را حل نمی‌کند —
 * چون مشکل «پنهان‌کردن» نیست، «جای اجرا» است.
 *
 * ── نقش `import 'server-only'` ────────────────────────────────
 * این ایمپورت یک نگهبان زمان-بیلد است. اگر روزی کسی اشتباهاً این
 * ماژول را از یک Client Component ایمپورت کند، بیلد **می‌شکند**:
 *
 *   Error: This module cannot be imported from a Client Component
 *
 * پس نشت دوباره ممکن نیست — نه با بازبینی کد، بلکه با کامپایلر.
 *
 * ── چرا NEXT_PUBLIC حذف شد؟ ───────────────────────────────────
 * هر متغیر با پیشوند `NEXT_PUBLIC_` در زمان بیلد داخل باندل
 * مرورگر جایگزین می‌شود. نام‌های جدید عمداً بدون آن پیشوندند تا
 * فقط روی سرور خوانده شوند:
 *
 *   ADMIN_USERNAME  (نه NEXT_PUBLIC_ADMIN_USERNAME)
 *   ADMIN_PASSWORD  (نه NEXT_PUBLIC_ADMIN_PASSWORD)
 *
 * ── این هنوز فاز پوسته است ────────────────────────────────────
 * رمز همچنان متن ساده در `.env.local` است، نه هش در دیتابیس.
 * چیزی که عوض شد: دیگر در **مرورگر** نیست. برای production واقعی
 * هنوز لازم است:
 *   • هش با bcrypt/argon2
 *   • rate limit سمت سرور روی IP (نه فقط شمارندهٔ درون‌حافظه‌ای)
 *   • ثبت لاگ ورود و احراز هویت دومرحله‌ای
 */

import type { AdminUser } from '@/types/user'

const DEFAULT_ADMIN_USERNAME = 'admin'
const DEFAULT_ADMIN_PASSWORD = 'saite-demo-1404'

/** نام کاربری مدیر — فقط از محیط سرور */
export const ADMIN_USERNAME =
  process.env.ADMIN_USERNAME?.trim() || DEFAULT_ADMIN_USERNAME

/** رمز مدیر — فقط از محیط سرور، هرگز در باندل کلاینت */
export const ADMIN_PASSWORD =
  process.env.ADMIN_PASSWORD?.trim() || DEFAULT_ADMIN_PASSWORD

/**
 * آیا اعتبارنامه هنوز مقدار پیش‌فرض است؟
 *
 * برای هشدار در UI استفاده می‌شود — اما توجه: خود این مقدار
 * بولین است، نه رمز. پس ارسالش به کلاینت نشت محسوب نمی‌شود.
 */
export const IS_USING_DEFAULT_CREDENTIALS =
  ADMIN_USERNAME === DEFAULT_ADMIN_USERNAME && ADMIN_PASSWORD === DEFAULT_ADMIN_PASSWORD

/**
 * مقایسهٔ زمان‌ثابت رشته‌ها.
 *
 * مقایسهٔ معمولی (`===`) به‌محض اولین کاراکتر متفاوت خارج می‌شود،
 * پس مدت اجرا اطلاعات لو می‌دهد. حالا که این کد روی سرور است،
 * این محافظت واقعاً معنا دارد — برخلاف قبل که در مرورگر خودِ
 * مهاجم اجرا می‌شد.
 */
function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return diff === 0
}

/** پروفایل مدیر پس از ورود موفق — بدون هیچ دادهٔ حساسی */
export const ADMIN_PROFILE: AdminUser = {
  id: 'admin-1',
  name: 'مدیر سیستم',
  email: 'admin@saite.local',
  role: 'admin',
}

/**
 * بررسی اعتبارنامه — **فقط روی سرور اجرا می‌شود**.
 *
 * نام کاربری بدون حساسیت به حروف بزرگ/کوچک و فاصله بررسی می‌شود،
 * اما رمز دقیقاً تطبیق داده می‌شود.
 */
export function matchesAdminCredentials(username: string, password: string): boolean {
  const normalized = username.trim().toLowerCase()
  const usernameOk = safeCompare(normalized, ADMIN_USERNAME.toLowerCase())
  const passwordOk = safeCompare(password, ADMIN_PASSWORD)

  // هر دو شرط جداگانه ارزیابی می‌شوند تا خروج زودهنگام نداشته باشیم
  return usernameOk && passwordOk
}
