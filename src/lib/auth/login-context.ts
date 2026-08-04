import { isSafeRedirectPath } from '@/lib/auth/safe-redirect'

/**
 * پیام زمینه‌ای صفحهٔ ورود بر اساس مقصد.
 *
 * ── چرا لازم است؟ ─────────────────────────────────────────────
 * کاربری که وسط تسویه‌حساب به `/login?redirect=/checkout` منتقل
 * می‌شود، هیچ توضیحی نمی‌بیند. تصور رایج: «سبد خریدم پرید».
 * این یکی از شایع‌ترین دلایل رها کردن خرید است.
 *
 * پارامتر `redirect` از قبل در URL هست؛ فقط استفاده نمی‌شد.
 */

export interface LoginContextMessage {
  title: string
  description: string
}

/** نگاشت مسیر مقصد به پیام — کلید بر اساس پیشوند مسیر */
const CONTEXT_BY_PREFIX: { prefix: string; message: LoginContextMessage }[] = [
  {
    prefix: '/checkout',
    message: {
      title: 'برای تکمیل خرید وارد شوید',
      description: 'سبد خرید شما محفوظ است و پس از ورود، مستقیم به ادامهٔ خرید برمی‌گردید.',
    },
  },
  {
    prefix: '/dashboard',
    message: {
      title: 'برای دیدن پنل کاربری وارد شوید',
      description: 'سفارش‌ها و اطلاعات حساب شما فقط پس از ورود نمایش داده می‌شود.',
    },
  },
  {
    prefix: '/wishlist',
    message: {
      title: 'برای دیدن علاقه‌مندی‌ها وارد شوید',
      description: 'کالاهای ذخیره‌شدهٔ شما پس از ورود در دسترس خواهند بود.',
    },
  },
]

/**
 * پیام متناسب با مقصد را برمی‌گرداند.
 * اگر مقصد نامعتبر یا ناشناخته باشد، `null` — یعنی ورود عادی.
 */
export function getLoginContextMessage(
  redirect: string | null | undefined
): LoginContextMessage | null {
  // مسیر ناامن هرگز نباید پیام بسازد — جلوگیری از تزریق متن
  if (!isSafeRedirectPath(redirect)) return null

  const match = CONTEXT_BY_PREFIX.find(
    (entry) => redirect === entry.prefix || redirect.startsWith(`${entry.prefix}/`)
  )
  return match?.message ?? null
}
