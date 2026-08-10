import 'server-only'
/* eslint-disable @typescript-eslint/no-explicit-any -- Prisma stub vs real */
import { prisma } from '@/server/shared/db'
import type { OrderState } from './state-machine'

export interface CreateOrderData {
  customerId: string
  status?: OrderState | string
  totalAmount: number
  currency?: string
  shippingAddress?: Record<string, unknown>
}

export interface CreateOrderItemData {
  orderId: string
  productId: string
  quantity: number
  unitPrice: number
}

export const ordersRepository = {
  async findById(id: string) {
    return prisma.order.findUnique({
      where: { id },
      include: { items: { include: { product: true } }, paymentIntents: true },
    })
  },

  async listByCustomer(customerId: string, page: number, perPage: number) {
    const [items, total] = await prisma.$transaction([
      prisma.order.findMany({
        where: { customerId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * perPage,
        take: perPage,
        include: { items: { include: { product: { select: { id: true, name: true, slug: true, images: true } } } } },
      }),
      prisma.order.count({ where: { customerId } }),
    ])
    return { items, total }
  },

  async create(data: CreateOrderData) {
    return prisma.order.create({ data: data as any })
  },

  async updateStatus(id: string, status: OrderState | string) {
    return prisma.order.update({
      where: { id },
      data: { status: status as any },
    })
  },

  async createOrderItem(data: CreateOrderItemData) {
    return prisma.orderItem.create({ data: data as any })
  },
}
