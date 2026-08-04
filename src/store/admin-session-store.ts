import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AuthUser } from '@/types/user'

/**
 * نشست پنل مدیریت — **کاملاً جدا از نشست مشتری**.
 *
 * ── چرا دو نشست جدا؟ ──────────────────────────────────────────
 * پیش از این هر دو نقش در `auth-store` مشترک بودند. نتیجه:
 * وقتی مدیر وارد پنل می‌شد، فروشگاه هم او را «مشتری واردشده»
 * می‌دید — سبد خرید، علاقه‌مندی و مسیر تسویه‌حساب برایش باز
 * می‌شد. این هم از نظر تجربهٔ کاربری گیج‌کننده است و هم از نظر
 * امنیتی نادرست:
 *
 *  ۱. **اصل کمترین امتیاز**: نشست مدیر نباید مجوز خرید بدهد.
 *     یک XSS در فروشگاه نباید بتواند از نشست مدیر سوءاستفاده کند.
 *  ۲. **جداسازی دامنه**: خروج از پنل نباید سبد خرید مشتری را
 *     پاک کند و برعکس.
 *  ۳. **حسابرسی**: عملیات مدیریتی باید به هویت مدیر نسبت داده
 *     شود، نه به یک نشست مبهم که هر دو نقش را دارد.
 *
 * ── الزام فاز بک‌اند ──────────────────────────────────────────
 * این تفکیک باید در سرور هم بازتاب پیدا کند:
 *   • دو کوکی جدا با نام و مسیر متفاوت:
 *       `saite_session`       → Path=/
 *       `saite_admin_session` → Path=/admin  ← به فروشگاه ارسال نمی‌شود
 *   • هر دو httpOnly + secure + sameSite=strict
 *   • کوکی مدیر عمر کوتاه‌تر (مثلاً ۳۰ دقیقه بی‌فعالیتی)
 *   • middleware فقط کوکی مدیر را برای /admin بررسی کند
 */

interface AdminSessionState {
  admin: AuthUser | null
  isAdminAuthenticated: boolean
  signIn: (admin: AuthUser) => void
  signOut: () => void
}

export const useAdminSessionStore = create<AdminSessionState>()(
  persist(
    (set) => ({
      admin: null,
      isAdminAuthenticated: false,
      signIn: (admin) => set({ admin, isAdminAuthenticated: true }),
      signOut: () => set({ admin: null, isAdminAuthenticated: false }),
    }),
    {
      // کلید جدا از 'auth-storage' مشتری
      name: 'admin-session',
    }
  )
)
