import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ProductCardData } from '@/types/product'

export interface CartItem {
  id: string
  slug: string
  name: string
  brand: string
  model: string
  /** قیمت لحظهٔ افزودن به سبد — کالای استعلامی وارد سبد نمی‌شود */
  price: number
  image: string
  quantity: number
}

interface CartState {
  items: CartItem[]
  /** Product کامل یا ProductCardData — هر دو کافی‌اند */
  addItem: (product: ProductCardData, quantity?: number) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  totalPrice: () => number
  itemCount: () => number
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
  }
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

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

      clearCart: () => set({ items: [] }),

      totalPrice: () =>
        get().items.reduce((total, item) => total + item.price * item.quantity, 0),

      itemCount: () => get().items.reduce((total, item) => total + item.quantity, 0),
    }),
    { name: 'cart-storage' }
  )
)
