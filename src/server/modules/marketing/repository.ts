import 'server-only'
/* eslint-disable @typescript-eslint/no-explicit-any -- Prisma stub vs real */
import { prisma } from '@/server/shared/db'

export type DbCouponType = 'percentage' | 'fixed_amount' | 'free_shipping'

export interface CreateCouponData {
  code: string
  name: string
  description?: string | null
  type: DbCouponType | string
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
}

export interface CreateCampaignData {
  name: string
  description?: string | null
  type: string
  startDate: Date
  endDate: Date
  bannerUrl?: string | null
  targetUrl?: string | null
  priority?: number
  metadata?: Record<string, unknown> | null
}

export const marketingRepository = {
  async createCoupon(data: CreateCouponData) {
    return prisma.coupon.create({
      data: {
        ...data,
        type: data.type as any,
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

  // اتمیک: فقط اگر سقف پر نشده باشد increment می‌کند — برای جلوگیری از race
  async tryIncrementCouponUsageAtomic(id: string, usageLimit: number | null): Promise<boolean> {
    if (usageLimit === null) {
      await prisma.coupon.update({
        where: { id },
        data: { usageCount: { increment: 1 } },
      })
      return true
    }
    const result = await prisma.coupon.updateMany({
      where: { id, usageCount: { lt: usageLimit } },
      data: { usageCount: { increment: 1 } },
    })
    return result.count === 1
  },

  async findRedemption(couponId: string, customerId: string) {
    return prisma.couponRedemption.findUnique({
      where: { couponId_customerId: { couponId, customerId } },
    })
  },

  async countRedemptionsByCustomer(couponId: string, customerId: string) {
    return prisma.couponRedemption.count({
      where: { couponId, customerId },
    })
  },

  async createRedemption(data: { couponId: string; customerId: string; orderId: string }) {
    return prisma.couponRedemption.create({ data })
  },

  async updateCoupon(id: string, data: Partial<{ name: string; active: boolean; expiresAt: Date | null }>) {
    return prisma.coupon.update({ where: { id }, data })
  },

  async createCampaign(data: CreateCampaignData) {
    return prisma.campaign.create({
      data: {
        ...data,
        priority: data.priority || 0,
        metadata: data.metadata ? (data.metadata as any) : undefined,
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
