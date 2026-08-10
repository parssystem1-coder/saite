import 'server-only'
import { inventoryRepository, type InventoryLine } from './repository'

export const inventoryService = {
  /** Called only inside order-creation transaction. */
  reserveForOrder: inventoryRepository.reserveForOrder,
  confirmOrder: inventoryRepository.confirmOrder,
  releaseOrder: inventoryRepository.releaseOrder,
  expireReservations: inventoryRepository.expireReservations,
  setOnHand: inventoryRepository.setOnHand,
  // Compatibility for older callers; new checkout must always supply an orderId.
  async reserveItems(_items: InventoryLine[]) {
    throw new Error('reserveItems بدون orderId منسوخ شده است؛ از reserveForOrder استفاده کنید')
  },
}
