import 'server-only'
import { prisma } from '@/server/shared/db'
import { paginatedList } from '@/server/shared/repo-utils'

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
    const where: Record<string, unknown> = {}
    if (opts.to) where.to = opts.to

    return paginatedList<Awaited<ReturnType<typeof prisma.emailLog.findMany>>[number]>(
      prisma.emailLog,
      { where, page: opts.page, limit: opts.limit }
    )
  },

  async listSmsLogs(opts: { to?: string; page?: number; limit?: number }) {
    const where: Record<string, unknown> = {}
    if (opts.to) where.to = opts.to

    return paginatedList<Awaited<ReturnType<typeof prisma.smsLog.findMany>>[number]>(
      prisma.smsLog,
      { where, page: opts.page, limit: opts.limit }
    )
  },
}
