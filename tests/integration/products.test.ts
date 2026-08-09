import { describe, it, expect, vi, beforeAll } from 'vitest'
import { productsService } from '@/server/modules/products/service'

// این تست قبلاً به سرور زنده نیاز داشت (fetch localhost:3000)
// حالا با mock Prisma بدون نیاز به DB/سرور اجرا می‌شود
// اگر DATABASE_URL واقعی دارید، می‌توانید این mock را بردارید و fetch واقعی بزنید

vi.mock('@/server/shared/db', () => ({
  prisma: {
    product: {
      findMany: vi.fn().mockResolvedValue([
        {
          id: 'p1',
          slug: 'canon-i-sensys-lbp-2900',
          name: 'پرینتر Canon',
          brand: 'canon',
          model: 'LBP2900',
          sku: 'CAN-001',
          category: 'printer',
          price: 10000000,
          priceType: 'fixed',
          stockStatus: 'in_stock',
          images: [],
          shortDescription: 'test',
          isFeatured: false,
          isBestSeller: false,
        },
      ]),
      findUnique: vi.fn().mockImplementation(({ where }: { where: { slug?: string } }) => {
        if (where.slug === 'canon-i-sensys-lbp-2900') {
          return Promise.resolve({
            id: 'p1',
            slug: 'canon-i-sensys-lbp-2900',
            name: 'پرینتر Canon',
          })
        }
        return Promise.resolve(null)
      }),
      count: vi.fn().mockResolvedValue(1),
    },
    $transaction: vi.fn(async (args: [Promise<unknown>, Promise<number>]) => {
      const [items, total] = await Promise.all(args)
      return [items, total] as never
    }),
  },
}))

describe('Products API (integration) — mocked DB', () => {
  beforeAll(async () => {
    // no-op
  })

  it('GET /api/products returns paginated list (via service)', async () => {
    const result = await productsService.getList({ page: 1, perPage: 9 })
    expect(result.items).toBeDefined()
    expect(result.total).toBeDefined()
    expect(result.page).toBe(1)
    expect(result.perPage).toBe(9)
  })

  it('GET /api/products/by-slug/:slug returns a product (via service)', async () => {
    const product = await productsService.getBySlug('canon-i-sensys-lbp-2900')
    expect(product.slug).toBe('canon-i-sensys-lbp-2900')
  })

  it('سقف perPage ۱۰۰ در integration هم اعمال می‌شود', async () => {
    const result = await productsService.getList({ perPage: 1000 } as never)
    expect(result.perPage).toBe(100)
  })
})
