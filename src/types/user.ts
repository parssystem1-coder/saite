/**
 * مدل کاربر احراز هویت‌شده.
 *
 * ══════════════════════════════════════════════════════════════
 *  🆕 مدل نقش سه‌سطحی — چرا از دو سطح به سه سطح رفتیم
 * ══════════════════════════════════════════════════════════════
 * قبلاً فقط `'user' | 'admin'` داشتیم. برای فروشگاه ساده کافی
 * بود، اما در B2B واقعی که یک شرکت چند اپراتور دارد این کم
 * است: حسابدار باید فقط finance ببیند، پشتیبان فقط
 * orders/customers، و مدیر همه‌چیز. با یک نقش `admin`، یا همه
 * دسترسی می‌گیرند یا هیچ‌کس.
 *
 * سه نقش سرور:
 *   • viewer   — فقط خواندن، هیچ عمل نوشتنی نیست
 *   • operator — عملیات روزمره (orders, customers, communications)
 *                ولی نه finance/settings/users
 *   • admin    — همه‌کاره، از جمله عوض کردن نقش
 *
 * منبع سنجش مجوز در `src/lib/auth/rbac.ts` است.
 *
 * از store جدا نگه داشته شده تا لایهٔ دامنه (گاردها، helperها،
 * تست‌ها) بتواند بدون وابستگی به Zustand این تایپ‌ها را استفاده
 * کند.
 */

/** نقش کاربر فروشگاه — همیشه 'user' */
export type CustomerRole = 'user'

/** نقش‌های پنل مدیریت — به ترتیب دسترسی صعودی */
export type AdminRole = 'viewer' | 'operator' | 'admin'

/**
 * اتحاد همهٔ نقش‌ها.
 *
 * چرا union و نه enum: enumها در TypeScript ابزار زمان-اجرا هم
 * می‌سازند و برای مقادیر ثابت رشته‌ای بیش از حد سنگین‌اند.
 */
export type UserRole = CustomerRole | AdminRole

export interface AuthUser {
  id: string
  name: string
  email: string
  role: UserRole
}

/**
 * مشتری فروشگاه — نقش همیشه 'user'.
 *
 * تایپ باریک‌شده تا نشست مشتری هرگز نتواند نقش مدیر بگیرد.
 * نشست مدیر مسیر و store جداگانهٔ خودش را دارد.
 */
export interface CustomerUser extends AuthUser {
  role: 'user'
}

/**
 * مدیر پنل — یکی از سه نقش admin.
 *
 * ⚠️ توجه: `AdminUser['role']` دیگر `'admin'` نیست بلکه
 * `AdminRole = 'viewer' | 'operator' | 'admin'` است. اگر کدی
 * قبلاً `admin.role === 'admin'` را برای گارد استفاده می‌کرد،
 * حالا باید از `hasPermission()` استفاده کند.
 */
export interface AdminUser extends AuthUser {
  role: AdminRole
}
