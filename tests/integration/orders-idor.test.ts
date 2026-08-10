import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ordersService } from '@/server/modules/orders/service'
import { canAccessOrder } from '@/lib/auth/customer-scope'

vi.mock('@/server/shared/db', () => ({
  prisma: {
    order: {
      findUnique: vi.fn(),
    },
  },
}))

const { prisma } = await import('@/server/shared/db')

describe('GET /api/orders/[id] — IDOR Protection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('Q1-2a: مشتری می‌تواند سفارش خود را ببیند', async () => {
    const mockOrder = {
      id: 'order1',
      customerId: 'cust1',
      status: 'pending',
      totalAmount: 10000000,
    }

    vi.mocked(prisma.order.findUnique).mockResolvedValue(mockOrder as never)

    const order = await ordersService.getById('order1')
    const canAccess = canAccessOrder('cust1', order)

    expect(canAccess).toBe(true)
  })

  it('Q1-2b: مشتری نمی‌تواند سفارش مشتری دیگر را ببیند', async () => {
    const mockOrder = {
      id: 'order1',
      customerId: 'cust1',
      status: 'pending',
      totalAmount: 10000000,
    }

    vi.mocked(prisma.order.findUnique).mockResolvedValue(mockOrder as never)

    const order = await ordersService.getById('order1')
    const canAccess = canAccessOrder('cust2', order) // مشتری متفاوت

    expect(canAccess).toBe(false)
  })

  it('Q1-2c: سفارش ناموجود — NotFoundError', async () => {
    vi.mocked(prisma.order.findUnique).mockResolvedValue(null)

    await expect(ordersService.getById('nonexistent')).rejects.toThrow('سفارش یافت نشد')
  })

  it('Q1-2d: canAccessOrder — بررسی null/undefined customerId', () => {
    const mockOrder = { customerId: 'cust1' }

    expect(canAccessOrder('cust1', mockOrder)).toBe(true)
    expect(canAccessOrder('cust2', mockOrder)).toBe(false)
    expect(canAccessOrder('', mockOrder)).toBe(false)
    expect(canAccessOrder('cust1', { customerId: '' })).toBe(false)
  })
})
