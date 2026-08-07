import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ProductCardData } from '@/types/product'

/**
 * سبد خرید — وضعیت کلاینت.
 *
 * ══════════════════════════════════════════════════════════════
 *  🆕 مرز اعتماد: قیمت داخل سبد «نمایشی» است، نه مرجع
 * ══════════════════════════════════════════════════════════════
 * این store با `persist` در `localStorage` می‌نشیند. یعنی هر
 * کاربری می‌تواند در DevTools بنویسد:
 *
 *   localStorage.setItem('cart-storage',
 *     JSON.stringify({ state: { items: [{ ..., price: 1 }] } }))
 *
 * و پرینتر ۵ میلیونی را با ۱ تومان سفارش دهد.
 *
 * علاوه بر آن، مشکل بی‌سروصداتری هم هست: کاربر امروز کالا را در
 * سبد می‌گذارد، دو هفته بعد برمی‌گردد و قیمت بیات دو هفته پیش را
 * می‌بیند.
 *
 * ── قرارداد جدید ──────────────────────────────────────────────
 *  • مرجع واقعی سبد فقط `id` و `quantity` است.
 *  • `price` صرفاً برای نمایش فوری بدون رفت‌وبرگشت سرور است.
 *  • `pricedAt` می‌گوید این قیمت مال چه زمانی است.
 *  • **مبلغ نهایی سفارش باید روی سرور با
 *    `repriceCart()` از `@/lib/checkout/price-authority`
 *    محاسبه شود.** هر جای دیگری که `totalPrice()` را مبنای پرداخت
 *    بگذارد، باگ امنیتی است نه راحتی.
 *
 * ⚠️ این store عمداً **بدون تغییر شکست‌زا** به‌روز شده: تمام
 *    امضاهای قبلی (`addItem`، `removeItem`، `updateQuantity`،
 *    `clearCart`، `totalPrice`، `itemCount`) دقیقاً همان‌اند.
 *    فقط فیلد و اکشن اضافه شده است.
 */

export interface CartItem {
  id: string
  slug: string
  name: string
  brand: string
  model: string
  /**
   * قیمت نمایشی. **مرجع پرداخت نیست.**
   * کالای استعلامی اصلاً وارد سبد نمی‌شود.
   */
  price: number
  image: string
  quantity: number
  /** زمان (ms) آخرین باری که این قیمت از منبع داده گرفته شد */
  pricedAt?: number
}

/** شکل سبکی که برای قیمت‌گذاری به سرور فرستاده می‌شود */
export interface CartLine {
  id: string
  quantity: number
}

/** پاسخ منبع داده برای هم‌ترازی قیمت */
export interface PriceSnapshot {
  id: string
  price?: number
  priceType: 'fixed' | 'quote_only'
  stockStatus: string
}

/** گزارش تغییرات پس از هم‌ترازی — برای نمایش به کاربر */
export interface PriceSyncReport {
  changed: { id: string; from: number; to: number }[]
  removed: string[]
}

interface CartState {
  items: CartItem[]
  /** زمان آخرین هم‌ترازی موفق با منبع داده */
  lastSyncedAt: number | null
  /** Product کامل یا ProductCardData — هر دو کافی‌اند */
  addItem: (product: ProductCardData, quantity?: number) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  totalPrice: () => number
  itemCount: () => number
  /** فقط id و quantity — چیزی که باید به سرور برود */
  toLines: () => CartLine[]
  /** هم‌ترازی قیمت‌ها با دادهٔ تازه؛ کالای ناموجود/استعلامی حذف می‌شود */
  syncPrices: (snapshots: PriceSnapshot[]) => PriceSyncReport
}

/** فقط کالای دارای قیمت ثابت قابل افزودن به سبد است */
function toCartItem(product: ProductCardData, quantity: number): CartItem | null {
  if (product.priceType !== 'fixed' || product.price === undefined) return null

  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    brand: product.brand,
    model: product.model,
    price: product.price,
    image: product.images[0] ?? '',
    quantity,
    pricedAt: Date.now(),
  }
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      lastSyncedAt: null,

      addItem: (product, quantity = 1) => {
        if (quantity <= 0) return

        const items = get().items
        const existing = items.find((item) => item.id === product.id)

        if (existing) {
          set({
            items: items.map((item) =>
              item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item
            ),
          })
          return
        }

        const newItem = toCartItem(product, quantity)
        if (!newItem) return // کالای استعلامی: باید از مسیر «استعلام قیمت» برود

        set({ items: [...items, newItem] })
      },

      removeItem: (productId) => {
        set({ items: get().items.filter((item) => item.id !== productId) })
      },

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId)
          return
        }
        set({
          items: get().items.map((item) =>
            item.id === productId ? { ...item, quantity } : item
          ),
        })
      },

      clearCart: () => set({ items: [], lastSyncedAt: null }),

      /**
       * مجموع **نمایشی**.
       *
       * ⚠️ این عدد را روی فاکتور یا درخواست پرداخت ننشانید. مبلغ
       * قابل پرداخت فقط از `repriceCart()` روی سرور می‌آید.
       */
      totalPrice: () =>
        get().items.reduce((total, item) => total + item.price * item.quantity, 0),

      itemCount: () => get().items.reduce((total, item) => total + item.quantity, 0),

      toLines: () => get().items.map(({ id, quantity }) => ({ id, quantity })),

      /**
       * هم‌ترازی با دادهٔ تازه.
       *
       * سه اتفاق ممکن است:
       *   • قیمت عوض شده  → به‌روز می‌شود و در گزارش می‌آید
       *   • کالا حذف/ناموجود/استعلامی شده → از سبد بیرون می‌رود
       *   • بدون تغییر → دست نمی‌خورد
       *
       * گزارش برگشتی برای این است که UI بتواند بگوید «قیمت دو
       * کالا تغییر کرد» — سکوت در این مورد باعث می‌شود کاربر سر
       * صفحهٔ پرداخت غافلگیر شود.
       */
      syncPrices: (snapshots) => {
        const bySnapshotId = new Map(snapshots.map((s) => [s.id, s]))
        const changed: PriceSyncReport['changed'] = []
        const removed: string[] = []
        const now = Date.now()

        const nextItems: CartItem[] = []

        for (const item of get().items) {
          const fresh = bySnapshotId.get(item.id)

          if (
            !fresh ||
            fresh.priceType !== 'fixed' ||
            fresh.price === undefined ||
            fresh.stockStatus === 'out_of_stock'
          ) {
            removed.push(item.id)
            continue
          }

          if (fresh.price !== item.price) {
            changed.push({ id: item.id, from: item.price, to: fresh.price })
          }

          nextItems.push({ ...item, price: fresh.price, pricedAt: now })
        }

        set({ items: nextItems, lastSyncedAt: now })
        return { changed, removed }
      },
    }),
    {
      name: 'cart-storage',
      /*
        نسخه ۲: فیلد `pricedAt` اضافه شد.

        بدون `migrate`، سبدهای ذخیره‌شدهٔ نسخهٔ ۱ بی‌صدا دور
        ریخته می‌شدند و کاربری که دیروز سبد پر کرده بود امروز
        سبد خالی می‌دید.
      */
      version: 2,
      migrate: (persisted, version) => {
        const state = persisted as { items?: CartItem[] } | undefined
        if (!state?.items) return { items: [], lastSyncedAt: null }

        if (version < 2) {
          return {
            // قیمت قدیمی «تاریخ‌دار» نیست؛ undefined یعنی «نامعلوم، هم‌تراز کن»
            items: state.items.map((item) => ({ ...item, pricedAt: undefined })),
            lastSyncedAt: null,
          }
        }

        return state
      },
      // توابع سریال نمی‌شوند؛ فقط دادهٔ خام ذخیره شود
      partialize: (state) => ({ items: state.items, lastSyncedAt: state.lastSyncedAt }),
    }
  )
)
