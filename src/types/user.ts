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
