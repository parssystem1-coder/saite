import { describe, it, expect, beforeAll, beforeEach } from 'vitest'
import { prisma, truncateAllTables } from './helpers/db'
import { seedCustomer, seedOrder } from './helpers/seed'
import { ordersService } from '@/server/modules/orders/service'
import { InvalidStateTransitionError } from '@/server/modules/orders/state-machine'

/**
 * فاز ۶ — گذار موازی وضعیت سفارش (W3).
 *
 * دو transitionState(paid) هم‌زمان → یک برنده، یکی InvalidStateTransitionError.
 * اثبات optimistic state check: `updateMany WHERE status=from` فقط یکی را می‌گذارد.
 */
describe('db-integration — گذار موازی وضعیت سفارش (W3)', () => {
  beforeAll(async () => {
    await truncateAllTables()
  })

  beforeEach(async () => {
    await truncateAllTables()
  })

  it('دو گذار هم‌زمان به paid → یک برنده و یکی خطای گذار نامعتبر', async () => {
    const customer = await seedCustomer()
    const order = await seedOrder(customer.id)

    const transition = () =>
      ordersService.transitionState(order.id, 'paid', 'test-actor')

    const results = await Promise.allSettled([transition(), transition()])

    const fulfilled = results.filter((r) => r.status === 'fulfilled')
    const rejected = results.filter((r) => r.status === 'rejected')

    // یکی موفق، یکی رد — و دلیلِ رد InvalidStateTransitionError است
    expect(fulfilled).toHaveLength(1)
    expect(rejected).toHaveLength(1)
    if (rejected[0] && rejected[0].status === 'rejected') {
      expect(rejected[0].reason).toBeInstanceOf(InvalidStateTransitionError)
    }

    // وضعیت نهایی paid است
    const finalOrder = await prisma.order.findUnique({ where: { id: order.id } })
    expect(finalOrder?.status).toBe('paid')
  })
})
