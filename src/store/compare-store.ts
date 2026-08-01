import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Product } from '@/types/product'

/** حداکثر تعداد کالای قابل مقایسه — بیش از این، جدول روی موبایل غیرقابل خواندن می‌شود */
export const MAX_COMPARE = 4

export interface CompareItem {
  id: string
  slug: string
  name: string
  brand: string
  model: string
  image: string
  category: string
}

interface CompareState {
  items: CompareItem[]
  /** اگر کالا موجود باشد حذف و در غیر این صورت اضافه می‌کند */
  toggle: (product: Product) => void
  remove: (id: string) => void
  clear: () => void
  has: (id: string) => boolean
  isFull: () => boolean
}

function toCompareItem(p: Product): CompareItem {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    brand: p.brand,
    model: p.model,
    image: p.images[0] ?? '',
    category: p.category,
  }
}

export const useCompareStore = create<CompareState>()(
  persist(
    (set, get) => ({
      items: [],

      toggle: (product) => {
        const items = get().items
        const exists = items.some((i) => i.id === product.id)

        if (exists) {
          set({ items: items.filter((i) => i.id !== product.id) })
          return
        }
        if (items.length >= MAX_COMPARE) return // سقف رعایت می‌شود

        set({ items: [...items, toCompareItem(product)] })
      },

      remove: (id) => set({ items: get().items.filter((i) => i.id !== id) }),
      clear: () => set({ items: [] }),
      has: (id) => get().items.some((i) => i.id === id),
      isFull: () => get().items.length >= MAX_COMPARE,
    }),
    { name: 'compare-storage' }
  )
)
