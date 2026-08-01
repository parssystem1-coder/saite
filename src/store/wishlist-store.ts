import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Product } from '@/types/product'

export interface WishlistItem {
  id: string
  slug: string
  name: string
  brand: string
  model: string
  image: string
  addedAt: string
}

interface WishlistState {
  items: WishlistItem[]
  toggle: (product: Product) => void
  remove: (id: string) => void
  clear: () => void
  has: (id: string) => boolean
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],

      toggle: (product) => {
        const items = get().items
        if (items.some((i) => i.id === product.id)) {
          set({ items: items.filter((i) => i.id !== product.id) })
          return
        }
        set({
          items: [
            ...items,
            {
              id: product.id,
              slug: product.slug,
              name: product.name,
              brand: product.brand,
              model: product.model,
              image: product.images[0] ?? '',
              addedAt: new Date().toISOString(),
            },
          ],
        })
      },

      remove: (id) => set({ items: get().items.filter((i) => i.id !== id) }),
      clear: () => set({ items: [] }),
      has: (id) => get().items.some((i) => i.id === id),
    }),
    { name: 'wishlist-storage' }
  )
)
