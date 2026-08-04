import { useCartStore } from '@/store/cart-store'
import { useCompareStore } from '@/store/compare-store'
import { useWishlistStore } from '@/store/wishlist-store'

/**
 * پاک‌سازی دادهٔ شخصی هنگام خروج.
 *
 * ── مشکلی که این ماژول حل می‌کند ──────────────────────────────
 * سبد خرید، علاقه‌مندی و فهرست مقایسه در localStorage ذخیره
 * می‌شوند و به حساب گره نخورده‌اند. تا پیش از این، `logout()` فقط
 * وضعیت ورود را پاک می‌کرد — یعنی روی یک دستگاه مشترک:
 *
 *   کاربر A وارد می‌شود → ۳ کالا در سبد می‌گذارد → خارج می‌شود
 *   کاربر B وارد می‌شود → **سبد کاربر A را می‌بیند**
 *
 * این هم نشت حریم خصوصی است (کاربر B می‌فهمد A چه می‌خریده) و هم
 * می‌تواند به سفارش اشتباه منجر شود.
 *
 * ── چرا «اخیراً دیده‌شده» هم پاک می‌شود؟ ──────────────────────
 * تاریخچهٔ بازدید محصولات هم دادهٔ شخصی است. روی دستگاه مشترک،
 * کاربر بعدی نباید ببیند نفر قبلی دنبال چه بوده.
 *
 * ── الزام فاز بک‌اند ──────────────────────────────────────────
 * وقتی سبد روی سرور ذخیره شود، این تابع باید:
 *   • سبد را پیش از پاک‌کردن محلی، با حساب کاربر همگام کند
 *   • `POST /api/auth/logout` را صدا بزند تا کوکی سرور باطل شود
 * پاک‌کردن state کلاینت به‌تنهایی یعنی نشست روی سرور معتبر می‌ماند.
 */

/** کلیدهای غیرحساس که بین کاربران مشترک می‌مانند */
const SHARED_KEYS = new Set([
  'saite:device-id', // شناسهٔ مرورگر — به حساب وابسته نیست
  'saite:trusted-devices', // فهرست دستگاه‌ها، به تفکیک حساب نگهداری می‌شود
])

const PERSONAL_STORAGE_KEYS = [
  'saite:recently-viewed', // تاریخچهٔ بازدید (sessionStorage)
  'saite:last-order-ref',
  'saite:last-order-meta',
] as const

/**
 * پاک‌کردن همهٔ دادهٔ شخصی این نشست.
 *
 * توجه: شناسهٔ دستگاه و فهرست دستگاه‌های مورد اعتماد **پاک
 * نمی‌شوند** — وگرنه کاربر پس از هر خروج، دستگاهش را از دست
 * می‌داد و دوباره باید تأیید می‌کرد.
 */
export function clearPersonalSessionData(): void {
  // ── وضعیت خرید ────────────────────────────────────────────
  useCartStore.getState().clearCart()
  useWishlistStore.getState().clear()
  useCompareStore.getState().clear()

  // ── تاریخچه و سفارش موقت ──────────────────────────────────
  if (typeof window === 'undefined') return

  for (const key of PERSONAL_STORAGE_KEYS) {
    if (SHARED_KEYS.has(key)) continue
    try {
      sessionStorage.removeItem(key)
      localStorage.removeItem(key)
    } catch {
      /* حالت private */
    }
  }
}
