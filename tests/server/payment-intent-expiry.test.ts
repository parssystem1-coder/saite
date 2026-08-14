import { describe, it, expect, vi, beforeEach } from 'vitest'
import { expirePaymentIntents } from '@/server/jobs/dispatchers/inventory-expiry-dispatcher'

vi.mock('@/server/shared/db', () => ({
  prisma: {
    paymentIntent: { updateMany: vi.fn() },
    // inventoryRepository استفاده‌شده در inventoryService اینجا mock نمی‌شود؛
    // فقط expirePaymentIntents را تست می‌کنیم.
  },
}))

import { prisma } from '@/server/shared/db'

describe('expirePaymentIntents — فاز ۴.۱', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(prisma.paymentIntent.updateMany).mockResolvedValue({ count: 2 } as never)
  })

  it('intentهای در وضعیت active با expiresAt گذشته → expired', async () => {
    const count = await expirePaymentIntents()

    expect(count).toBe(2)
    const args = vi.mocked(prisma.paymentIntent.updateMany).mock.calls[0]![0] as {
      where: { status: { in: string[] }; expiresAt: { lte: Date } }
      data: { status: string }
    }
    // فقط intentهای غیر-نهایی (created/redirect_required/pending)
    expect(args.where.status.in).toEqual(['created', 'redirect_required', 'pending'])
    // شرط انقضا: expiresAt <= now
    expect(args.where.expiresAt.lte).toBeInstanceOf(Date)
    // داده: expired
    expect(args.data.status).toBe('expired')
  })
})
