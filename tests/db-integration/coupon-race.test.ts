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

    // ۵ مشتری متفاوت — چون redemption روی (couponId, customerId) unique است،
    // برای سنجیدنِ سقفِ کلیِ usageLimit باید هر apply از یک مشتری جدا باشد.
    const applies = []
    for (let i = 0; i < 5; i++) {
      const customer = await seedCustomer()
      const order = await seedOrder(customer.id)
      applies.push(() =>
        marketingService.applyCoupon(coupon.code, order.id, {
          orderAmount: 1_000_000,
          customerId: customer.id,
        })
      )
    }

    // اجرای موازی ۵ apply — advisory lock + updateMany شرطی روی usageCount
    const results = await Promise.allSettled(applies.map((fn) => fn()))

    const fulfilled = results.filter((r) => r.status === 'fulfilled')
    const rejected = results.filter((r) => r.status === 'rejected')
    const reasons = rejected.map((r) =>
      r.status === 'rejected'
        ? r.reason instanceof Error
          ? `${r.reason.constructor.name}: ${r.reason.message}`
          : String(r.reason)
        : ''
    )
    // سقف ۳ — فقط ۳ تا موفق
    expect(
      fulfilled,
      `موفق=${fulfilled.length}، ردشده=${rejected.length}\nدلایل رد:\n${reasons.join('\n') || '(هیچ)'}`
    ).toHaveLength(3)

    const redemptions = await prisma.couponRedemption.count({
      where: { couponId: coupon.id },
    })
    expect(redemptions).toBe(3)

    const updatedCoupon = await prisma.coupon.findUnique({ where: { id: coupon.id } })
    expect(updatedCoupon?.usageCount).toBe(3)
  })
})
