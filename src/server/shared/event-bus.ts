import 'server-only'
/* eslint-disable @typescript-eslint/no-explicit-any -- Prisma stub vs real، any برای InputJsonValue */
import { logger } from '@/server/shared/logger'
import { prisma } from './db'
import type { ProductEvent } from '@/server/modules/products/events'
import type { FinanceEvent } from '@/server/modules/finance/events'
import type { ShippingEvent } from '@/server/modules/shipping/events'
import type { MarketingEvent } from '@/server/modules/marketing/events'
import type { ContentEvent } from '@/server/modules/content/events'

type DomainEvent = ProductEvent | FinanceEvent | ShippingEvent | MarketingEvent | ContentEvent | { type: string; [key: string]: unknown }

export const eventBus = {
  async publish(type: string, payload: Record<string, unknown>) {
    await prisma.outboxEvent.create({
      data: {
        type,
        payload: payload as any,
        aggregateId: (payload.productId as string) || (payload.orderId as string) || 'unknown',
      },
    })
  },

  async subscribe<T extends DomainEvent>(
    eventType: T['type'],
    _handler: (event: T) => Promise<void>
  ) {
    // در فاز ۱: worker BullMQ این را poll می‌کند
    // در فاز ۲: Redis pub/sub اضافه می‌شود
    logger.info(`[eventBus] subscribe registered: ${eventType}`)
  },
}
