import 'server-only'
/* eslint-disable @typescript-eslint/no-explicit-any -- Prisma stub vs real، any برای InputJsonValue */
import { prisma } from '@/server/shared/db'

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

  async create(data: Record<string, unknown>) {
    return prisma.order.create({ data: data as any })
  },

  async updateStatus(id: string, status: string) {
    return prisma.order.update({
      where: { id },
      data: { status: status as any },
    })
  },

  async createOrderItem(data: Record<string, unknown>) {
    return prisma.orderItem.create({ data: data as any })
  },
}
