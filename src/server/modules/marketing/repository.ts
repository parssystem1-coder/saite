import 'server-only'
import { prisma } from '@/server/shared/db'

export const marketingRepository = {
  async createCoupon(data: {
    code: string
    name: string
    description?: string
    type: string
    value: number
    minOrderAmount?: number
    maxDiscount?: number | null
    usageLimit?: number | null
    perCustomerLimit?: number
    startsAt?: Date | null
    expiresAt?: Date | null
    applicableProducts?: string[]
    applicableCategories?: string[]
    firstOrderOnly?: boolean
  }) {
    return prisma.coupon.create({
      data: {
        ...data,
        type: data.type as never,
        minOrderAmount: data.minOrderAmount || 0,
        perCustomerLimit: data.perCustomerLimit || 1,
        applicableProducts: data.applicableProducts || [],
        applicableCategories: data.applicableCategories || [],
        firstOrderOnly: data.firstOrderOnly || false,
      },
    })
  },

  async findCouponById(id: string) {
    return prisma.coupon.findUnique({ where: { id } })
  },

  async findCouponByCode(code: string) {
    return prisma.coupon.findUnique({ where: { code } })
  },

  async listCoupons(opts: {
    active?: boolean
    page?: number
    limit?: number
  }) {
    const page = opts.page || 1
    const limit = opts.limit || 20
    const where: Record<string, unknown> = {}
    if (opts.active !== undefined) where.active = opts.active

    const [items, total] = await Promise.all([
      prisma.coupon.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.coupon.count({ where }),
    ])
    return { items, total, page, limit }
  },

  async incrementCouponUsage(id: string) {
    return prisma.coupon.update({
      where: { id },
      data: { usageCount: { increment: 1 } },
    })
  },

  async updateCoupon(id: string, data: Partial<{ name: string; active: boolean; expiresAt: Date | null }>) {
    return prisma.coupon.update({ where: { id }, data })
  },

  async createCampaign(data: {
    name: string
    description?: string
    type: string
    startDate: Date
    endDate: Date
    bannerUrl?: string
    targetUrl?: string
    priority?: number
    metadata?: unknown
  }) {
    return prisma.campaign.create({
      data: {
        ...data,
        priority: data.priority || 0,
        metadata: data.metadata ? (data.metadata as never) : undefined,
      },
    })
  },

  async findCampaignById(id: string) {
    return prisma.campaign.findUnique({ where: { id } })
  },

  async listActiveCampaigns() {
    const now = new Date()
    return prisma.campaign.findMany({
      where: {
        active: true,
        startDate: { lte: now },
        endDate: { gte: now },
      },
      orderBy: [{ priority: 'desc' }, { startDate: 'asc' }],
    })
  },

  async listCampaigns(opts: { page?: number; limit?: number }) {
    const page = opts.page || 1
    const limit = opts.limit || 20
    const [items, total] = await Promise.all([
      prisma.campaign.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.campaign.count(),
    ])
    return { items, total, page, limit }
  },
}
