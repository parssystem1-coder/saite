import { describe, it, expect, vi, beforeEach } from 'vitest'
import { runLogRetention } from '@/server/jobs/dispatchers/log-retention-dispatcher'

vi.mock('@/server/shared/db', () => ({
  prisma: {
    emailLog: { deleteMany: vi.fn() },
    smsLog: { deleteMany: vi.fn() },
    outboxEvent: { deleteMany: vi.fn() },
    aiUsageLog: { deleteMany: vi.fn() },
    $transaction: vi.fn(async (queries: Promise<{ count: number }>[]) =>
      Promise.all(queries)
    ),
  },
}))

import { prisma } from '@/server/shared/db'

describe('log-retention-dispatcher — پاکسازی دوره‌ای PII', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(prisma.emailLog.deleteMany).mockResolvedValue({ count: 3 } as never)
    vi.mocked(prisma.smsLog.deleteMany).mockResolvedValue({ count: 2 } as never)
    vi.mocked(prisma.outboxEvent.deleteMany).mockResolvedValue({ count: 5 } as never)
    vi.mocked(prisma.aiUsageLog.deleteMany).mockResolvedValue({ count: 1 } as never)
  })

  it('چهار جدول PII را با شرط سن (lt cutoff) پاک می‌کند', async () => {
    const result = await runLogRetention()

    expect(result).toEqual({ emailLogs: 3, smsLogs: 2, outbox: 5, aiUsage: 1 })

    // email/sms — فقط older از retention cutoff
    const emailArgs = vi.mocked(prisma.emailLog.deleteMany).mock.calls[0][0] as {
      where: { createdAt: { lt: Date } }
    }
    expect(emailArgs.where.createdAt.lt).toBeInstanceOf(Date)

    // outbox — فقط رویدادهای پردازش‌شدهٔ قدیمی
    const outboxArgs = vi.mocked(prisma.outboxEvent.deleteMany).mock.calls[0][0] as {
      where: { processedAt: unknown; createdAt: { lt: Date } }
    }
    expect(outboxArgs.where.processedAt).not.toBeNull()
    expect(outboxArgs.where.createdAt.lt).toBeInstanceOf(Date)
  })

  it('همهٔ کوئری‌ها در یک تراکنش اجرا می‌شوند', async () => {
    await runLogRetention()
    expect(prisma.$transaction).toHaveBeenCalledTimes(1)
  })
})
