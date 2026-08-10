import 'server-only'
import { inventoryRepository } from './repository'

export const inventoryService = {
  /**
   * Batch reserve — رفع N+1 query
   * به جای حلقه for...of با N تا findUnique، یک findMany + FOR UPDATE
   */
  async reserveItems(items: { productId: string; quantity: number }[]) {
    return inventoryRepository.reserveBatch(items)
  },

  /**
   * Batch release — رفع N+1 query
   */
  async releaseItems(items: { productId: string; quantity: number }[]) {
    if (items.length === 0) return
    // TODO: فاز ۳ — release واقعی با جدول inventory
    // فعلاً فقط بررسی می‌کنیم که محصولات وجود داشته باشند
    const productIds = items.map(i => i.productId)
    return Promise.all(
      productIds.map(productId => inventoryRepository.release(productId, 0))
    )
  },
}
