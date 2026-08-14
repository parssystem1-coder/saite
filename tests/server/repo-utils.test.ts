import { describe, it, expect, vi } from 'vitest'
import { paginatedList } from '@/server/shared/repo-utils'

describe('paginatedList — الگوی مشترک صفحه‌بندی (فاز ۵)', () => {
  it('findMany + count را با skip/take صحیح صدا می‌زند', async () => {
    const findMany = vi.fn().mockResolvedValue([{ id: 'a' }, { id: 'b' }])
    const count = vi.fn().mockResolvedValue(20)
    const model = { findMany, count }

    const result = await paginatedList<{ id: string }>(model, {
      where: { status: 'active' },
      page: 2,
      limit: 2,
    })

    expect(result).toEqual({ items: [{ id: 'a' }, { id: 'b' }], total: 20, page: 2, limit: 2 })
    expect(findMany).toHaveBeenCalledWith({
      where: { status: 'active' },
      orderBy: { createdAt: 'desc' },
      skip: 2,
      take: 2,
    })
    expect(count).toHaveBeenCalledWith({ where: { status: 'active' } })
  })

  it('پیش‌فرض صفحه ۱ و limit ۲۰ را اعمال می‌کند', async () => {
    const findMany = vi.fn().mockResolvedValue([])
    const count = vi.fn().mockResolvedValue(0)
    await paginatedList<unknown>({ findMany, count }, { where: {} })

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 0, take: 20, orderBy: { createdAt: 'desc' } })
    )
  })

  it('include را به findMany پاس می‌دهد', async () => {
    const findMany = vi.fn().mockResolvedValue([])
    const count = vi.fn().mockResolvedValue(0)
    await paginatedList<unknown>(
      { findMany, count },
      { where: {}, include: { transactions: true } }
    )

    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({ include: { transactions: true } }))
  })
})
