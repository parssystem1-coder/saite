import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ordersService } from '@/server/modules/orders/service'

vi.mock('@/server/shared/db', () => ({
  prisma: {
    product: {
      findMany: vi.fn(),
    },
    order: {
      create: vi.fn(),
    },
    orderItem: {
      createMany: vi.fn(),
    },
    outboxEvent: {
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}))

const { prisma } = await import('@/server/shared/db')

describe('POST /api/orders — Order Creation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('Q1-1a: happy path — ایجاد سفارش با محصولات موجود', async () => {
    const mockProducts = [
      { id: 'p1', name: 'پرینتر Canon', price: 10000000, priceType: 'fixed', stockStatus: 'in_stock' },
      { id: 'p2', name: 'کارتریج ۳۰۳', price: 500000, priceType: 'fixed', stockStatus: 'in_stock' },
    ]

    const mockOrder = { id: 'order1', customerId: 'cust1', status: 'pending', totalAmount: 11000000 }

    vi.mocked(prisma.product.findMany).mockResolvedValue(mockProducts as never)
    vi.mocked(prisma.$transaction).mockResolvedValue(mockOrder as never)

    const result = await ordersService.create({
      customerId: 'cust1',
      items: [
        { productId: 'p1', quantity: 1 },
        { productId: 'p2', quantity: 2 },
      ],
      shippingAddress: { city: 'Tehran', street: 'Test St' },
    })

    expect(result).toBeDefined()
    expect(result.id).toBe('order1')
    expect(prisma.product.findMany).toHaveBeenCalledOnce()
    expect(prisma.$transaction).toHaveBeenCalledOnce()
  })

  it('Q1-1b: سبد خالی — ValidationError', async () => {
    try {
      await ordersService.create({
        customerId: 'cust1',
        items: [],
        shippingAddress: { city: 'Tehran' },
      })
      expect.fail('Should have thrown')
    } catch (e) {
      expect(e).toBeInstanceOf(Error)
      expect((e as Error).message).toBe('اعتبارسنجی ناموفق')
    }
  })

  it('Q1-1c: محصول ناموجود — ValidationError', async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValue([])

    try {
      await ordersService.create({
        customerId: 'cust1',
        items: [{ productId: 'nonexistent', quantity: 1 }],
        shippingAddress: { city: 'Tehran' },
      })
      expect.fail('Should have thrown')
    } catch (e) {
      expect(e).toBeInstanceOf(Error)
      expect((e as Error).message).toBe('اعتبارسنجی ناموفق')
    }
  })

  it('Q1-1d: محصول استعلامی (quote_only) — ValidationError', async () => {
    const mockProducts = [
      { id: 'p1', name: 'دستگاه صنعتی', price: null, priceType: 'quote_only', stockStatus: 'in_stock' },
    ]

    vi.mocked(prisma.product.findMany).mockResolvedValue(mockProducts as never)

    try {
      await ordersService.create({
        customerId: 'cust1',
        items: [{ productId: 'p1', quantity: 1 }],
        shippingAddress: { city: 'Tehran' },
      })
      expect.fail('Should have thrown')
    } catch (e) {
      expect(e).toBeInstanceOf(Error)
      expect((e as Error).message).toBe('اعتبارسنجی ناموفق')
    }
  })

  it('Q1-1e: محصول ناموجود (out_of_stock) — ValidationError', async () => {
    const mockProducts = [
      { id: 'p1', name: 'پرینتر', price: 10000000, priceType: 'fixed', stockStatus: 'out_of_stock' },
    ]

    vi.mocked(prisma.product.findMany).mockResolvedValue(mockProducts as never)

    try {
      await ordersService.create({
        customerId: 'cust1',
        items: [{ productId: 'p1', quantity: 1 }],
        shippingAddress: { city: 'Tehran' },
      })
      expect.fail('Should have thrown')
    } catch (e) {
      expect(e).toBeInstanceOf(Error)
      expect((e as Error).message).toBe('اعتبارسنجی ناموفق')
    }
  })

  it('Q1-1f: سقف quantity (MAX_QUANTITY_PER_LINE=20) — ValidationError', async () => {
    try {
      await ordersService.create({
        customerId: 'cust1',
        items: [{ productId: 'p1', quantity: 100 }],
        shippingAddress: { city: 'Tehran' },
      })
      expect.fail('Should have thrown')
    } catch (e) {
      expect(e).toBeInstanceOf(Error)
      expect((e as Error).message).toBe('اعتبارسنجی ناموفق')
    }
  })

  it('Q1-1g: تعداد کل از سقف گذشت (تکراری‌ها جمع زده می‌شوند)', async () => {
    const mockProducts = [
      { id: 'p1', name: 'پرینتر', price: 10000000, priceType: 'fixed', stockStatus: 'in_stock' },
    ]

    vi.mocked(prisma.product.findMany).mockResolvedValue(mockProducts as never)

    // 3 ردیف از یک محصول × 10 = 30 > 20
    try {
      await ordersService.create({
        customerId: 'cust1',
        items: [
          { productId: 'p1', quantity: 10 },
          { productId: 'p1', quantity: 10 },
          { productId: 'p1', quantity: 10 },
        ],
        shippingAddress: { city: 'Tehran' },
      })
      expect.fail('Should have thrown')
    } catch (e) {
      expect(e).toBeInstanceOf(Error)
      expect((e as Error).message).toBe('اعتبارسنجی ناموفق')
    }
  })

  it('Q1-1h: شناسه محصول نامعتبر (null) — ValidationError', async () => {
    try {
      await ordersService.create({
        customerId: 'cust1',
        items: [{ productId: null as any, quantity: 1 }],
        shippingAddress: { city: 'Tehran' },
      })
      expect.fail('Should have thrown')
    } catch (e) {
      expect(e).toBeInstanceOf(Error)
      expect((e as Error).message).toBe('اعتبارسنجی ناموفق')
    }
  })
})
