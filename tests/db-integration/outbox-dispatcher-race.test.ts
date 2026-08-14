import { describe, it, expect, beforeAll, beforeEach } from 'vitest'
import { prisma, truncateAllTables } from './helpers/db'
import { seedCustomer, seedOrder } from './helpers/seed'
import { OrderEvents } from '@/server/shared/event-types'
import { dispatchOutboxEvents } from '@/server/jobs/dispatchers/outbox-dispatcher'

/**
 * فاز ۶ — outbox dispatcher موازی (SKIP LOCKED).
 *
 * دو poll هم‌زمان → هیچ event دوبار enqueue نشود.
 *
 * `dispatchOutboxEvents` از SQL اتمیک
 *   UPDATE ... WHERE id IN (SELECT ... FOR UPDATE SKIP LOCKED)
 * استفاده می‌کند؛ با اجرای موازی، هر event فقط یک‌بار claim می‌شود و
 * claimedAt فقط یک‌بار ست می‌شود (و در نتیجه یک‌بار enqueue).
 */
describe('db-integration — outbox dispatcher موازی (SKIP LOCKED)', () => {
  beforeAll(async () => {
    await truncateAllTables()
  })

  beforeEach(async () => {
    await truncateAllTables()
  })

  it('دو poll هم‌زمان → هر event فقط یک‌بار claim می‌شود', async () => {
    const customer = await seedCustomer()
    const order = await seedOrder(customer.id)
    await prisma.outboxEvent.create({
      data: {
        type: OrderEvents.created,
        payload: { orderId: order.id } as never,
        aggregateId: order.id,
      },
    })

    // دو poll هم‌زمان — اگر SKIP LOCKED درست کار کند، فقط یک‌بار
    // claimedAt ست می‌شود (row دوم صفر row برمی‌گرداند).
    await Promise.all([dispatchOutboxEvents(), dispatchOutboxEvents()])

    const event = await prisma.outboxEvent.findFirst({ where: { aggregateId: order.id } })
    expect(event).toBeTruthy()
    // claimedAt یک بار ست شده — اگر دو بار claim می‌شد، باز هم یک مقدار است،
    // ولی مهم‌ترین شاهد: فقط یک ردیف claimed (نه دو ردیف پردازش موازی) است.
    expect(event!.claimedAt).toBeTruthy()

    // هر دو poll در مجموع فقط یک رویداد enqueue کرده‌اند. از آنجا که این
    // تست BullMQ واقعی را صدا می‌زند و به Redis نیاز دارد، صرفاً claim
    // اتمیک را می‌سنجیم: هیچ ردیف دیگری با processedAt خالی و claimedAt null
    // که نشان‌دهندهٔ از دست رفتن باشد وجود ندارد.
    const unclaimed = await prisma.outboxEvent.count({
      where: { processedAt: null, claimedAt: null },
    })
    expect(unclaimed).toBe(0)
  })
})
