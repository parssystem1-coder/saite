import 'server-only'
import { inventoryRepository } from './repository'

export const inventoryService = {
  async reserveItems(items: { productId: string; quantity: number }[]) {
    for (const item of items) {
      await inventoryRepository.reserve(item.productId, item.quantity)
    }
  },

  async releaseItems(items: { productId: string; quantity: number }[]) {
    for (const item of items) {
      await inventoryRepository.release(item.productId, item.quantity)
    }
  },
}
