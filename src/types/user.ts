/**
 * مدل کاربر احراز هویت‌شده.
 *
 * از store جدا نگه داشته شده تا لایهٔ دامنه (گاردها، helperها، تست‌ها)
 * بتواند بدون وابستگی به Zustand این تایپ‌ها را استفاده کند.
 */

export type UserRole = 'user' | 'admin'

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

/** مدیر پنل — نقش همیشه 'admin' */
export interface AdminUser extends AuthUser {
  role: 'admin'
}
