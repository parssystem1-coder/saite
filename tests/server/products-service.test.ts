import { describe, expect, it, vi, beforeEach } from 'vitest'
import { productsService } from '@/server/modules/products/service'

vi.mock('@/server/shared/db', () => ({
  prisma: {
    product: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    $transaction: vi.fn(async (args: unknown) => {
      // برای list: args is [findMany, count]
      if (Array.isArray(args)) {
        const [items, total] = await Promise.all(args as [Promise<unknown>, Promise<number>])
        return [items, total] as never
      }
      return null as never
    }),
  },
}))

vi.mock('@/server/shared/event-bus', () => ({
  eventBus: { publish: vi.fn().mockResolvedValue(undefined) },
}))

import { prisma } from '@/server/shared/db'

describe('productsService.getList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('سقف perPage ۱۰۰ اعمال می‌شود', async () => {
    const mockProducts = [{ id: '1', name: 'Test' }]
    vi.mocked(prisma.product.findMany).mockResolvedValue(mockProducts as never)
    vi.mocked(prisma.product.count).mockResolvedValue(1 as never)

    const result = await productsService.getList({ perPage: 1000 } as never)
    expect(result.perPage).toBe(100)
  })

  it('صفحه نامعتبر به ۱ نرمال می‌شود', async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValue([] as never)
    vi.mocked(prisma.product.count).mockResolvedValue(0 as never)

    const result = await productsService.getList({ page: -5 } as never)
    expect(result.page).toBe(1)
  })

  it('featured/bestSeller از query خوانده می‌شود', async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValue([] as never)
    vi.mocked(prisma.product.count).mockResolvedValue(0 as never)

    await productsService.getList({ isFeatured: true } as never)
    expect(prisma.product.findMany).toHaveBeenCalled()
    const where = (vi.mocked(prisma.product.findMany).mock.calls[0]?.[0] as { where?: unknown })?.where as Record<string, unknown>
    expect(where?.isFeatured).toBe(true)
  })
})

describe('productsService.getBySlug', () => {
  it('محصول ناموجود خطا می‌دهد', async () => {
    vi.mocked(prisma.product.findUnique).mockResolvedValue(null as never)
    await expect(productsService.getBySlug('not-found')).rejects.toThrow('محصول یافت نشد')
  })
})
