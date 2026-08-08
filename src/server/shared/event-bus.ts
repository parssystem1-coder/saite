import 'server-only'
import { prisma } from './db'
import type { Prisma } from '@prisma/client'
import type { ProductEvent } from '@/server/modules/products/events'

type DomainEvent = ProductEvent | { type: string; [key: string]: unknown }

export const eventBus = {
  async publish(type: string, payload: Record<string, unknown>) {
    await prisma.outboxEvent.create({
      data: {
        type,
        payload: payload as unknown as Prisma.JsonValue,
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
    console.log(`[eventBus] subscribe registered: ${eventType}`)
  },
}
