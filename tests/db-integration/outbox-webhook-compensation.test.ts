import { describe, it, expect, beforeAll, beforeEach } from 'vitest'
import { prisma, truncateAllTables } from './helpers/db'
import { seedCustomer, seedOrder } from './helpers/seed'
import { OrderEvents } from '@/server/shared/event-types'

/**
 * فاز ۶ — webhook دوباره (W1) + جبران توسط outbox worker.
 *
 * verify موفق → کرشِ شبیه‌سازی‌شده قبل از transition → رویداد outbox موجود
 * → worker (handlePaidOrder) جبران می‌کند.
 *
 * اینجا چون پردازش واقعی worker/درگاه نیازمند Redis و درگاه واقعی است،
 * منطق جبران idempotent را به‌صورت مستقیم شبیه‌سازی می‌کنیم: بعد از کرش،
 * همان مسیر جبران (transitionState + پردازش outbox) اجرا می‌شود و رویداد
 * را consume می‌کند.
 */
describe('db-integration — جبران webhook توسط outbox (W1)', () => {
  beforeAll(async () => {
    await truncateAllTables()
  })

  beforeEach(async () => {
    await truncateAllTables()
  })

  it('رویداد order.paid موجود → پردازش idempotent → سفارش paid', async () => {
    const customer = await seedCustomer()
    const order = await seedOrder(customer.id)

    // شبیه‌سازی رویداد outbox که webhook در تراکنش verify ثبت کرده
    // (قبل از transition که کرش کرد)
    await prisma.outboxEvent.create({
      data: {
        type: OrderEvents.paid,
        payload: { orderId: order.id } as never,
        aggregateId: order.id,
      },
    })

    // ── جبران (همان کاری که worker outbox می‌کند) ──
    const event = await prisma.outboxEvent.findFirst({
      where: { type: OrderEvents.paid, processedAt: null },
    })
    expect(event).toBeTruthy()

    // claim شرطی idempotent
    const claimed = await prisma.outboxEvent.updateMany({
      where: { id: event!.id, processedAt: null },
      data: { processedAt: new Date() },
    })
    expect(claimed.count).toBe(1)

    // پردازش: چون سفارش هنوز pending است، transition به paid می‌شود
    const { ordersService } = await import('@/server/modules/orders/service')
    const orderRow = await prisma.order.findUnique({ where: { id: order.id } })
    if (orderRow?.status === 'pending') {
      await ordersService.transitionState(order.id, 'paid', 'outbox-worker')
    }

    const finalOrder = await prisma.order.findUnique({ where: { id: order.id } })
    expect(finalOrder?.status).toBe('paid')
  })

  it('claim دوبارهٔ همان رویداد → count=0 (مصرف idempotent)', async () => {
    const customer = await seedCustomer()
    const order = await seedOrder(customer.id)
    const event = await prisma.outboxEvent.create({
      data: {
        type: OrderEvents.created,
        payload: { orderId: order.id } as never,
        aggregateId: order.id,
        processedAt: new Date(),
      },
    })

    // job دوم تلاش می‌کند دوباره consume کند → صفر
    const claimed = await prisma.outboxEvent.updateMany({
      where: { id: event.id, processedAt: null },
      data: { processedAt: new Date() },
    })
    expect(claimed.count).toBe(0)
  })
})
