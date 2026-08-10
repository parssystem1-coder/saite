import 'server-only'
/* eslint-disable @typescript-eslint/no-explicit-any -- Prisma stub vs real، any برای InputJsonValue */
import { prisma } from '@/server/shared/db'

export const shippingRepository = {
  async createShipment(data: {
    orderId: string
    carrier: string
    trackingNumber?: string
    shippingCost?: number
    weightGrams?: number
    dimensions?: string
    originAddress?: unknown
    destinationAddress?: unknown
    estimatedDelivery?: Date
    notes?: string
  }) {
    return prisma.shipment.create({
      data: {
        ...data,
        shippingCost: data.shippingCost || 0,
        originAddress: data.originAddress ? (data.originAddress as any) : undefined,
        destinationAddress: data.destinationAddress ? (data.destinationAddress as any) : undefined,
      },
    })
  },

  async findShipmentById(id: string) {
    return prisma.shipment.findUnique({ where: { id } })
  },

  async findShipmentByOrderId(orderId: string) {
    return prisma.shipment.findUnique({ where: { orderId } })
  },

  async updateShipmentStatus(id: string, status: string, extra?: { shippedAt?: Date; deliveredAt?: Date; trackingNumber?: string }) {
    return prisma.shipment.update({
      where: { id },
      data: {
        status: status as any,
        ...(extra?.shippedAt && { shippedAt: extra.shippedAt }),
        ...(extra?.deliveredAt && { deliveredAt: extra.deliveredAt }),
        ...(extra?.trackingNumber && { trackingNumber: extra.trackingNumber }),
      },
    })
  },

  async listShipments(opts: {
    carrier?: string
    status?: string
    page?: number
    limit?: number
  }) {
    const page = opts.page || 1
    const limit = opts.limit || 20
    const where: Record<string, unknown> = {}
    if (opts.carrier) where.carrier = opts.carrier
    if (opts.status) where.status = opts.status

    const [items, total] = await Promise.all([
      prisma.shipment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.shipment.count({ where }),
    ])
    return { items, total, page, limit }
  },

  async createShippingRate(data: {
    carrier: string
    zone: string
    minWeight?: number
    maxWeight?: number | null
    baseCost: number
    perKgCost?: number
    codFee?: number
    estimatedDays?: number
  }) {
    return prisma.shippingRate.create({
      data: {
        ...data,
        minWeight: data.minWeight || 0,
        perKgCost: data.perKgCost || 0,
        codFee: data.codFee || 0,
        estimatedDays: data.estimatedDays || 3,
      },
    })
  },

  async findShippingRates(opts: { carrier?: string; zone?: string; active?: boolean }) {
    const where: Record<string, unknown> = {}
    if (opts.carrier) where.carrier = opts.carrier
    if (opts.zone) where.zone = opts.zone
    if (opts.active !== undefined) where.active = opts.active
    return prisma.shippingRate.findMany({
      where,
      orderBy: [{ carrier: 'asc' }, { minWeight: 'asc' }],
    })
  },

  async calculateShippingCost(carrier: string, zone: string, weightGrams: number) {
    const rate = await prisma.shippingRate.findFirst({
      where: {
        carrier,
        zone,
        active: true,
        minWeight: { lte: weightGrams },
        OR: [{ maxWeight: null }, { maxWeight: { gte: weightGrams } }],
      },
      orderBy: { baseCost: 'asc' },
    })

    if (!rate) return null

    const weightKg = weightGrams / 1000
    const extraCost = Math.ceil(weightKg * rate.perKgCost)
    return {
      baseCost: rate.baseCost,
      extraCost,
      totalCost: rate.baseCost + extraCost,
      estimatedDays: rate.estimatedDays,
      carrier: rate.carrier,
      zone: rate.zone,
    }
  },
}
