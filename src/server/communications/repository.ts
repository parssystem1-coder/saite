import 'server-only'
import { prisma } from '@/server/shared/db'

export const commsRepository = {
  async logEmail(data: {
    to: string
    subject: string
    body: string
    template?: string
    provider: string
    status: string
    error?: string
    sentAt?: Date
  }) {
    return prisma.emailLog.create({ data })
  },

  async logSms(data: {
    to: string
    body: string
    template?: string
    provider: string
    status: string
    error?: string
    sentAt?: Date
  }) {
    return prisma.smsLog.create({ data })
  },

  async listEmailLogs(opts: { to?: string; page?: number; limit?: number }) {
    const page = opts.page || 1
    const limit = opts.limit || 20
    const where: Record<string, unknown> = {}
    if (opts.to) where.to = opts.to

    const [items, total] = await Promise.all([
      prisma.emailLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.emailLog.count({ where }),
    ])
    return { items, total, page, limit }
  },

  async listSmsLogs(opts: { to?: string; page?: number; limit?: number }) {
    const page = opts.page || 1
    const limit = opts.limit || 20
    const where: Record<string, unknown> = {}
    if (opts.to) where.to = opts.to

    const [items, total] = await Promise.all([
      prisma.smsLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.smsLog.count({ where }),
    ])
    return { items, total, page, limit }
  },
}
