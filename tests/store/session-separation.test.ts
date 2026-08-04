import { beforeEach, describe, expect, it } from 'vitest'
import { useAdminSessionStore } from '@/store/admin-session-store'
import { useAuthStore } from '@/store/auth-store'
import { useCartStore } from '@/store/cart-store'
import { sampleProduct } from '../fixtures/product'
import type { AdminUser, CustomerUser } from '@/types/user'

const admin: AdminUser = {
  id: 'admin-1',
  name: 'مدیر سیستم',
  email: 'admin@saite.local',
  role: 'admin',
}

const customer: CustomerUser = {
  id: 'user-1',
  name: 'کاربر آزمایشی',
  email: 'user@example.com',
  role: 'user',
}

beforeEach(() => {
  localStorage.clear()
  useAuthStore.setState({ user: null, isLoggedIn: false })
  useAdminSessionStore.setState({ admin: null, status: 'unknown', isAdminAuthenticated: false })
  useCartStore.setState({ items: [] })
})

/**
 * تفکیک نشست مدیر از نشست مشتری.
 *
 * مشکل گزارش‌شده: وقتی مدیر وارد پنل می‌شد، فروشگاه هم او را
 * «مشتری واردشده» می‌دید و مسیر خرید برایش باز بود.
 */
describe('جداسازی نشست مدیر و مشتری', () => {
  it('🔑 ورود مدیر، مشتری را وارد نمی‌کند', () => {
    useAdminSessionStore.getState().setAdmin(admin)

    expect(useAdminSessionStore.getState().isAdminAuthenticated).toBe(true)
    // فروشگاه باید او را مهمان ببیند
    expect(useAuthStore.getState().isLoggedIn).toBe(false)
    expect(useAuthStore.getState().user).toBeNull()
  })

  it('🔑 ورود مشتری، نشست مدیر نمی‌سازد', () => {
    useAuthStore.getState().login(customer)

    expect(useAuthStore.getState().isLoggedIn).toBe(true)
    expect(useAdminSessionStore.getState().isAdminAuthenticated).toBe(false)
    expect(useAdminSessionStore.getState().admin).toBeNull()
  })

  it('🔑 خروج مدیر به نشست مشتری دست نمی‌زند', () => {
    useAuthStore.getState().login(customer)
    useAdminSessionStore.getState().setAdmin(admin)

    useAdminSessionStore.getState().clear()

    expect(useAdminSessionStore.getState().isAdminAuthenticated).toBe(false)
    // مشتری همچنان وارد است — سبد و مسیر خریدش نباید بپرد
    expect(useAuthStore.getState().isLoggedIn).toBe(true)
    expect(useAuthStore.getState().user?.id).toBe('user-1')
  })

  it('🔑 خروج مشتری، نشست مدیر را قطع نمی‌کند', () => {
    useAuthStore.getState().login(customer)
    useAdminSessionStore.getState().setAdmin(admin)

    useAuthStore.getState().logout()

    expect(useAuthStore.getState().isLoggedIn).toBe(false)
    expect(useAdminSessionStore.getState().isAdminAuthenticated).toBe(true)
  })

  it('🔑 خروج مدیر سبد خرید مشتری را پاک نمی‌کند', () => {
    useCartStore.getState().addItem(sampleProduct, 2)
    useAdminSessionStore.getState().setAdmin(admin)

    useAdminSessionStore.getState().clear()

    expect(useCartStore.getState().itemCount()).toBe(2)
  })

  it('دو نشست هم‌زمان می‌توانند فعال باشند و مستقل بمانند', () => {
    useAuthStore.getState().login(customer)
    useAdminSessionStore.getState().setAdmin(admin)

    expect(useAuthStore.getState().user?.role).toBe('user')
    expect(useAdminSessionStore.getState().admin?.role).toBe('admin')
  })

  it('🔑 نشست مدیر اصلاً در localStorage ذخیره نمی‌شود', () => {
    /*
      این تست جای تست قبلی «کلیدهای متفاوت» را گرفت.

      قبلاً نشست مدیر با `persist` در localStorage می‌رفت و تست
      فقط بررسی می‌کرد کلیدش با کلید مشتری قاطی نشود. اما مشکل
      بزرگ‌تر این بود که **اصلاً نباید آنجا باشد**: هر اسکریپتی
      می‌توانست بخواندش و کاربر می‌توانست با یک خط در DevTools
      جعلش کند.

      حالا منبع حقیقت کوکی httpOnly است و این store فقط بازتاب
      حافظه‌ای آن است.
    */
    useAdminSessionStore.getState().setAdmin(admin)

    const keys = Object.keys(localStorage)
    expect(keys).not.toContain('admin-session')
    expect(
      keys.some((key) => localStorage.getItem(key)?.includes('isAdminAuthenticated'))
    ).toBe(false)
  })

  it('🔑 نشست مشتری همچنان کلید مخصوص خودش را دارد', () => {
    expect(useAuthStore.persist.getOptions().name).toBe('auth-storage')
  })
})

describe('نقش نشست مشتری', () => {
  it('🔑 همیشه user است — ارتقای نقش از فروشگاه ممکن نیست', () => {
    useAuthStore.getState().login(customer)
    expect(useAuthStore.getState().user?.role).toBe('user')
  })
})
