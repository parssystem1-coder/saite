import 'server-only'
/* eslint-disable @typescript-eslint/no-explicit-any -- Prisma TransactionClient و Map<any> برای stub vs real */
import { prisma } from '@/server/shared/db'
import { MAX_LINES, MAX_QUANTITY_PER_LINE } from '@/server/shared/constants'
import { ordersRepository } from './repository'
import { assertValidTransition } from './state-machine'
import { eventBus } from '@/server/shared/event-bus'
import { NotFoundError, ValidationError } from '@/server/shared/errors'

export interface CreateOrderInput {
  customerId: string
  items: { productId: string; quantity: number; unitPrice?: number }[]
  shippingAddress: Record<string, unknown>
}



export const ordersService = {
  async getById(id: string) {
    const order = await ordersRepository.findById(id)
    if (!order) throw new NotFoundError('سفارش یافت نشد')
    return order
  },

  async getCustomerOrders(customerId: string, page = 1, perPage = 10) {
    return ordersRepository.listByCustomer(customerId, page, perPage)
  },

  async create(input: CreateOrderInput) {
    // ── اعتبارسنجی ورودی ──────────────────────────
    if (!input.items || input.items.length === 0) {
      throw new ValidationError({ items: 'سبد خالی است' })
    }
    if (input.items.length > MAX_LINES) {
      throw new ValidationError({ items: `حداکثر ${MAX_LINES} ردیف مجاز است` })
    }

    // یکسان‌سازی: تکراری‌ها را جمع بزن، quantity را اعتبارسنجی کن
    const merged = new Map<string, number>()
    for (const it of input.items) {
      if (!it.productId || typeof it.productId !== 'string') {
        throw new ValidationError({ items: 'شناسه محصول نامعتبر است' })
      }
      const qty = Number(it.quantity)
      if (!Number.isFinite(qty) || qty < 1 || qty > MAX_QUANTITY_PER_LINE) {
        throw new ValidationError({ items: `تعداد هر ردیف باید بین ۱ و ${MAX_QUANTITY_PER_LINE} باشد` })
      }
      merged.set(it.productId, (merged.get(it.productId) || 0) + qty)
    }
    // اگر جمع تکراری‌ها از سقف گذشت
    for (const [, qty] of merged) {
      if (qty > MAX_QUANTITY_PER_LINE) {
        throw new ValidationError({ items: `تعداد محصول از سقف ${MAX_QUANTITY_PER_LINE} گذشت` })
      }
    }

    const productIds = [...merged.keys()]

    // ── قیمت‌گذاری سروری — تنها مرجع قیمت DB است ──────────────────────────
    const products = (await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        price: true,
        priceType: true,
        stockStatus: true,
        name: true,
      },
    })) as any[]

    const productMap = new Map<string, any>(products.map((p: any) => [p.id, p]))

    let totalAmount = 0
    const pricedItems: { productId: string; quantity: number; unitPrice: number }[] = []

    for (const [productId, quantity] of merged as Map<string, number>) {
      const product: any = productMap.get(productId)
      if (!product) {
        throw new ValidationError({ items: `محصول ${productId} یافت نشد` })
      }
      if (product.priceType !== 'fixed') {
        throw new ValidationError({ items: `محصول ${product.name} قیمت ثابت ندارد — استعلامی است` })
      }
      if (product.price == null) {
        throw new ValidationError({ items: `قیمت محصول ${product.name} نامشخص است` })
      }
      if (product.stockStatus === 'out_of_stock') {
        throw new ValidationError({ items: `محصول ${product.name} ناموجود است` })
      }
      const unitPrice = product.price
      totalAmount += unitPrice * quantity
      pricedItems.push({ productId, quantity, unitPrice })
    }

    // ── ثبت تراکنشی: Order + OrderItems + OutboxEvent ──────────────────────────
    const order = await prisma.$transaction(async (tx: any) => {
      const createdOrder = await tx.order.create({
        data: {
          customerId: input.customerId,
          status: 'pending',
          totalAmount,
          currency: 'IRR',
          shippingAddress: input.shippingAddress as unknown as any,
        },
      })

      // createMany برای پرهیز از N+1
      await tx.orderItem.createMany({
        data: pricedItems.map((it) => ({
          orderId: createdOrder.id,
          productId: it.productId,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
        })),
      })

      await tx.outboxEvent.create({
        data: {
          type: 'order.created',
          payload: { orderId: createdOrder.id, customerId: input.customerId } as unknown as any,
          aggregateId: createdOrder.id,
        },
      })

      return createdOrder
    })

    // publish اضافی برای سازگاری با workerهای قدیم (idempotent)
    // اگر تراکنش بالا outbox را ساخت، این publish تکراری idempotent است چون jobId=event.id
    // اما برای حفظ قرارداد فعلی، یک publish دوم نمی‌کنیم — outbox کافی است

    return order
  },

  async transitionState(orderId: string, newStatus: string, actorId: string) {
    const order = await this.getById(orderId)
    assertValidTransition(
      order.status as import('./state-machine').OrderState,
      newStatus as import('./state-machine').OrderState
    )
    const updated = await ordersRepository.updateStatus(orderId, newStatus)
    await eventBus.publish('order.status_changed', { orderId, from: order.status, to: newStatus, actorId })
    return updated
  },
}
