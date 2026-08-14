import 'server-only'

import { prisma } from '@/server/shared/db'
import { inventoryService } from '@/server/modules/inventory/service'
import { INVENTORY_EXPIRY_POLL_MS } from '@/server/shared/constants'
import { logger } from '@/server/shared/logger'

let intervalId: ReturnType<typeof setInterval> | null = null
let running = false

/**
 * Releases payment reservations that reached their expiry time.
 * The repository locks each order's active reservation rows, so this is safe
 * when more than one worker process is running.
 */
export async function expirePaymentIntents(): Promise<number> {
  const now = new Date()
  // intentهای منقضی‌شده‌ای که هنوز به‌درستی expire نشده‌اند را به expired
  // منتقل می‌کند. ایندکس (status, expiresAt) که در فاز ۲ ساخته شد همین
  // کوئری را پوشش می‌دهد.
  const result = await prisma.paymentIntent.updateMany({
    where: {
      status: { in: ['created', 'redirect_required', 'pending'] },
      expiresAt: { lte: now },
    },
    data: { status: 'expired' },
  })
  return result.count
}

export function startInventoryExpiryDispatcher() {
  if (intervalId) return

  const poll = async () => {
    if (running) return
    running = true
    try {
      const releasedOrders = await inventoryService.expireReservations()
      if (releasedOrders > 0) {
        logger.info({ releasedOrders }, '[InventoryExpiry] expired reservations released')
      }

      const expiredIntents = await expirePaymentIntents()
      if (expiredIntents > 0) {
        logger.info({ expiredIntents }, '[InventoryExpiry] expired PaymentIntents marked')
      }
    } catch (err) {
      logger.error({ err }, '[InventoryExpiry] poll failed')
    } finally {
      running = false
    }
  }

  intervalId = setInterval(poll, INVENTORY_EXPIRY_POLL_MS)
  intervalId.unref?.()
  void poll()
}

export function stopInventoryExpiryDispatcher() {
  if (!intervalId) return
  clearInterval(intervalId)
  intervalId = null
}
