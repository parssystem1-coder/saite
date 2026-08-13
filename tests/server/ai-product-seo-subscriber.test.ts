import { describe, expect, it, vi } from 'vitest'

const update = vi.fn()
const findUnique = vi.fn()

vi.mock('@/server/shared/db', () => ({
  prisma: {
    product: { update, findUnique },
  },
}))

const { handleProductCreated } = await import('@/server/ai/features/product-seo/subscriber')

describe('handleProductCreated — AI هرگز در دیتابیس نمی‌نویسد', () => {
  it('prisma.product.update صدا زده نمی‌شود', async () => {
    await handleProductCreated({ productId: 'p1', actorId: 'admin-1' })
    expect(update).not.toHaveBeenCalled()
    expect(findUnique).not.toHaveBeenCalled()
  })
})
