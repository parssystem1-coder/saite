import 'server-only'
import { ordersRepository } from './repository'
import { assertValidTransition } from './state-machine'
import { eventBus } from '@/server/shared/event-bus'
import { NotFoundError } from '@/server/shared/errors'
import type { Prisma } from '@prisma/client'

export interface CreateOrderInput {
  customerId: string
  items: { productId: string; quantity: number; unitPrice: number }[]
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
    const totalAmount = input.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)

    const order = await ordersRepository.create({
      customerId: input.customerId,
      status: 'pending',
      totalAmount,
      currency: 'IRR',
      shippingAddress: input.shippingAddress as unknown as Prisma.InputJsonValue,
    })

    for (const item of input.items) {
      await ordersRepository.createOrderItem({
        order: { connect: { id: order.id } },
        product: { connect: { id: item.productId } },
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })
    }

    await eventBus.publish('order.created', { orderId: order.id, customerId: input.customerId })
    return order
  },

  async transitionState(orderId: string, newStatus: string, actorId: string) {
    const order = await this.getById(orderId)
    assertValidTransition(order.status as import('./state-machine').OrderState, newStatus as import('./state-machine').OrderState)
    const updated = await ordersRepository.updateStatus(orderId, newStatus)
    await eventBus.publish('order.status_changed', { orderId, from: order.status, to: newStatus, actorId })
    return updated
  },
}
