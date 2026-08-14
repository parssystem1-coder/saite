import 'server-only'
import { Prisma, $Enums } from '@prisma/client'
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
    return prisma.order.create({
      data: {
        customer: { connect: { id: data.customerId } },
        status: (data.status || 'pending') as $Enums.OrderStatus,
        totalAmount: data.totalAmount,
        currency: data.currency || 'IRR',
        shippingAddress: data.shippingAddress as Prisma.InputJsonValue | undefined,
      },
    })
  },

  async updateStatus(id: string, status: OrderState | string) {
    return prisma.order.update({
      where: { id },
      data: { status: status as $Enums.OrderStatus },
    })
  },

  async createOrderItem(data: CreateOrderItemData) {
    return prisma.orderItem.create({
      data: {
        order: { connect: { id: data.orderId } },
        product: { connect: { id: data.productId } },
        quantity: data.quantity,
        unitPrice: data.unitPrice,
      },
    })
  },
}
