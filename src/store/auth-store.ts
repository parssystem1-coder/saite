import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AuthUser, CustomerUser } from '@/types/user'

/**
 * نشست **مشتری** فروشگاه.
 *
 * ⚠️ این store فقط برای تجربهٔ کاربری است — در localStorage ذخیره
 * می‌شود و کاربر می‌تواند آن را دستکاری کند. هیچ تصمیم امنیتی
 * نباید صرفاً بر پایهٔ آن گرفته شود.
 *
 * ── چرا اینجا نقش admin وجود ندارد؟ ───────────────────────────
 * تایپ ورودی عمداً `CustomerUser` است (نقش ثابت 'user'). پیش از
 * این `AuthUser` بود و یعنی هر کد کلاینتی می‌توانست با یک
 * `login({ role: 'admin' })` نشست مدیر بسازد. حالا نشست مدیر
 * فقط از `admin-session-store` می‌آید و تایپ‌چکر جلوی اشتباه را
 * می‌گیرد.
 */

interface AuthState {
  user: CustomerUser | null
  isLoggedIn: boolean
  login: (user: CustomerUser) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoggedIn: false,
      login: (user) => set({ user, isLoggedIn: true }),
      logout: () => set({ user: null, isLoggedIn: false }),
    }),
    {
      name: 'auth-storage',
    }
  )
)

export type { AuthUser }
