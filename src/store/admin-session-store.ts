import { create } from 'zustand'
import type { AdminUser } from '@/types/user'

/**
 * بازتاب نشست مدیر در کلاینت — **نه منبع حقیقت**.
 *
 * ══════════════════════════════════════════════════════════════
 *  چرا `persist` حذف شد
 * ══════════════════════════════════════════════════════════════
 * نسخهٔ قبلی این store نشست را در `localStorage` نگه می‌داشت. سه
 * مشکل داشت:
 *
 *  ۱. **قابل جعل بود.** کاربر می‌توانست در DevTools بنویسد
 *     `localStorage.setItem('admin-session', '{"state":{"isAdminAuthenticated":true}}')`
 *     و پنل باز می‌شد. گارد فقط همین مقدار را می‌خواند.
 *
 *  ۲. **در دسترس هر اسکریپتی بود.** یک XSS کافی بود تا نشست
 *     مدیر خوانده شود.
 *
 *  ۳. **با سرور همگام نبود.** کوکی سرور منقضی می‌شد اما کلاینت
 *     همچنان فکر می‌کرد وارد است.
 *
 * حالا منبع حقیقت کوکی `httpOnly` است که جاوااسکریپت اصلاً آن را
 * نمی‌بیند. این store فقط نتیجهٔ `GET /api/admin/session` را برای
 * UI نگه می‌دارد — پس جعل کردنش هیچ دری باز نمی‌کند: صفحه ممکن
 * است لحظه‌ای رندر شود، اما `proxy.ts` درخواست بعدی را ریدایرکت
 * می‌کند و هیچ Route Handler ادمینی پاسخ نمی‌دهد.
 *
 * ── چرا هنوز store لازم است؟ ──────────────────────────────────
 * برای اینکه سایدبار، نوار نشست و گارد بدون فراخوانی مکرر شبکه
 * وضعیت را بدانند. یک بار خوانده می‌شود، همه‌جا استفاده می‌شود.
 */

/** وضعیت بارگذاری نشست — سه‌حالته، نه بولین */
export type AdminSessionStatus = 'unknown' | 'authenticated' | 'anonymous'

interface AdminSessionState {
  admin: AdminUser | null
  /**
   * `unknown` یعنی هنوز از سرور نپرسیده‌ایم.
   *
   * تفکیک این حالت از `anonymous` مهم است: اگر یکی بودند، گارد
   * در اولین رندر کاربر واردشده را هم بیرون می‌انداخت.
   */
  status: AdminSessionStatus
  isAdminAuthenticated: boolean
  setAdmin: (admin: AdminUser | null) => void
  clear: () => void
}

export const useAdminSessionStore = create<AdminSessionState>()((set) => ({
  admin: null,
  status: 'unknown',
  isAdminAuthenticated: false,
  setAdmin: (admin) =>
    set({
      admin,
      status: admin ? 'authenticated' : 'anonymous',
      isAdminAuthenticated: admin !== null,
    }),
  clear: () => set({ admin: null, status: 'anonymous', isAdminAuthenticated: false }),
}))
