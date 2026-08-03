import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AuthUser } from '@/types/user'

/**
 * وضعیت احراز هویت سمت کلاینت.
 *
 * ⚠️ این store فقط برای تجربهٔ کاربری است — در localStorage ذخیره
 * می‌شود و کاربر می‌تواند آن را دستکاری کند. هیچ تصمیم امنیتی
 * نباید صرفاً بر پایهٔ آن گرفته شود.
 */

interface AuthState {
  user: AuthUser | null
  isLoggedIn: boolean
  login: (user: AuthUser) => void
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

/** آیا کاربر فعلی نقش مدیر دارد؟ — selector مشترک گاردها */
export const selectIsAdmin = (s: AuthState): boolean => s.user?.role === 'admin'
