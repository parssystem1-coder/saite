import { describe, it, expect, beforeAll, beforeEach } from 'vitest'
import { prisma, truncateAllTables } from './helpers/db'
import { seedProductWithInventory, seedCustomer, seedOrder } from './helpers/seed'
import { inventoryRepository } from '@/server/modules/inventory/repository'
import { ValidationError } from '@/server/shared/errors'
import { PAYMENT_INTENT_TTL_MS } from '@/server/shared/constants'

/**
 * فاز ۶ — سناریوی race روی رزرو موجودی واقعی.
 *
 * رزرو موازی: ۲ سفارش هم‌زمان روی محصولی با ۱ موجودی → دقیقاً یکی موفق.
 * اثبات `WHERE quantityOnHand - quantityReserved >= $1` (UPDATE شرطی اتمیک).
 */
describe('db-integration — رزرو موازی موجودی', () => {
  beforeAll(async () => {
    await truncateAllTables()
  })

  beforeEach(async () => {
    await truncateAllTables()
  })

  it('دو رزرو هم‌زمان روی ۱ موجودی → دقیقاً یکی موفق، دیگری خطای موجودی', async () => {
    const product = await seedProductWithInventory({ quantityOnHand: 1 })
    const customer = await seedCustomer()

    // دو سفارش جدا (به‌جای ordersService.create که خودش رزرو می‌کند،
    // مستقیماً reserveForOrder را در تراکنش‌های جدا اجرا می‌کنیم تا race
    // دقیقاً روی همین منطق سنجیده شود).
    const orderA = await seedOrder(customer.id)
    const orderB = await seedOrder(customer.id)

    const reserve = (orderId: string) =>
      prisma.$transaction(async (tx) => {
        await inventoryRepository.reserveForOrder(
          tx,
          orderId,
          [{ productId: product.id, quantity: 1 }],
          new Date(Date.now() + PAYMENT_INTENT_TTL_MS)
        )
      })

    // اجرای موازی دو تراکنش
    const results = await Promise.allSettled([reserve(orderA.id), reserve(orderB.id)])

    const fulfilled = results.filter((r) => r.status === 'fulfilled')
    const rejected = results.filter((r) => r.status === 'rejected')

    // دقیقاً یکی موفق و یکی با خطای موجودی رد شد
    expect(fulfilled).toHaveLength(1)
    expect(rejected).toHaveLength(1)
    if (rejected[0] && rejected[0].status === 'rejected') {
      expect(rejected[0].reason).toBeInstanceOf(ValidationError)
    }

    // فقط یک رزرو active باقی مانده
    const active = await prisma.inventoryReservation.count({
      where: { status: 'active' },
    })
    expect(active).toBe(1)
  })

  it('پرداخت دیرهنگام (W2): رزرو → expire → confirm → کسر شرطی یا خطای دامنه‌ای', async () => {
    const product = await seedProductWithInventory({ quantityOnHand: 2 })
    const customer = await seedCustomer()
    const order = await seedOrder(customer.id)

    // رزرو با انقضای کوتاه
    await prisma.$transaction(async (tx) => {
      await inventoryRepository.reserveForOrder(
        tx,
        order.id,
        [{ productId: product.id, quantity: 1 }],
        new Date(Date.now() - 1000) // منقضی شده
      )
    })

    // رزرو را expire کن
    await inventoryRepository.expireReservations(new Date())

    // موجودی هنوز ۲ است (رزرو آزاد شده)
    const item = await prisma.inventoryItem.findUnique({
      where: { productId: product.id },
    })
    expect(item?.quantityOnHand).toBe(2)
    expect(item?.quantityReserved).toBe(0)

    // confirm بعد از انقضا — موجودی کافی است پس کسر شرطی موفق می‌شود
    await prisma.$transaction(async (tx) => {
      await inventoryRepository.confirmOrderInTx(tx, order.id)
    })

    const afterConfirm = await prisma.inventoryItem.findUnique({
      where: { productId: product.id },
    })
    expect(afterConfirm?.quantityOnHand).toBe(1)
    expect(afterConfirm?.quantityReserved).toBe(0)
  })
})
