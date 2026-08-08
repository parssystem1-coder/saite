import 'server-only'
import { prisma } from '@/server/shared/db'
import type { Prisma } from '@prisma/client'

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

  async create(data: Prisma.OrderCreateInput) {
    return prisma.order.create({ data })
  },

  async updateStatus(id: string, status: string) {
    return prisma.order.update({
      where: { id },
      data: { status: status as import('@prisma/client').OrderStatus },
    })
  },

  async createOrderItem(data: Prisma.OrderItemCreateInput) {
    return prisma.orderItem.create({ data })
  },
}
