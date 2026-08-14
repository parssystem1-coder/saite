import { describe, it, expect, beforeAll, beforeEach } from 'vitest'
import { prisma, truncateAllTables } from './helpers/db'
import { seedCoupon, seedCustomer, seedOrder } from './helpers/seed'
import { marketingService } from '@/server/modules/marketing/service'

/**
 * فاز ۶ — کوپن موازی (advisory lock).
 *
 * ۵ apply هم‌زمان با usageLimit=3 → دقیقاً ۳ redemption.
 * اثبات pg_advisory_xact_lock + updateMany شرطی روی usageCount.
 */
describe('db-integration — کوپن موازی (advisory lock)', () => {
  beforeAll(async () => {
    await truncateAllTables()
  })

  beforeEach(async () => {
    await truncateAllTables()
  })

  it('۵ apply هم‌زمان با usageLimit=3 → دقیقاً ۳ redemption', async () => {
    const coupon = await seedCoupon({ usageLimit: 3, perCustomerLimit: 10 })
    const customer = await seedCustomer()

    // ۵ سفارش متفاوت (چون redemption.orderId @unique است)
    const orders = []
    for (let i = 0; i < 5; i++) orders.push(await seedOrder(customer.id))

    const apply = (orderId: string) =>
      marketingService.applyCoupon(coupon.code, orderId, {
        orderAmount: 1_000_000,
        customerId: customer.id,
      })

    const results = await Promise.allSettled(orders.map((o) => apply(o.id)))

    const fulfilled = results.filter((r) => r.status === 'fulfilled')
    // سقف ۳ — فقط ۳ تا موفق
    expect(fulfilled).toHaveLength(3)

    const redemptions = await prisma.couponRedemption.count({
      where: { couponId: coupon.id },
    })
    expect(redemptions).toBe(3)

    const updatedCoupon = await prisma.coupon.findUnique({ where: { id: coupon.id } })
    expect(updatedCoupon?.usageCount).toBe(3)
  })
})
