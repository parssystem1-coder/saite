import 'server-only'
import { productsRepository } from './repository'
import { eventBus } from '@/server/shared/event-bus'
import { NotFoundError, ValidationError } from '@/server/shared/errors'
import type { ProductListQuery, ProductListResult } from '@/lib/api-types'
import type { Prisma } from '@prisma/client'

const DEFAULT_PER_PAGE = 9

export const productsService = {
  async getList(query: ProductListQuery = {}): Promise<ProductListResult> {
    const page = Math.max(1, query.page ?? 1)
    const perPage = Math.max(1, query.perPage ?? DEFAULT_PER_PAGE)
    const { items, total } = await productsRepository.list(query, page, perPage)

    return {
      items: items as unknown as ProductListResult['items'],
      total,
      page,
      perPage,
      totalPages: Math.max(1, Math.ceil(total / perPage)),
    }
  },

  async getBySlug(slug: string) {
    const product = await productsRepository.findBySlug(slug)
    if (!product) throw new NotFoundError('محصول یافت نشد')
    return product
  },

  async getById(id: string) {
    const product = await productsRepository.findById(id)
    if (!product) throw new NotFoundError('محصول یافت نشد')
    return product
  },

  async create(input: unknown, actorId: string) {
    const data = input as Prisma.ProductCreateInput
    const product = await productsRepository.create(data)
    await eventBus.publish('product.created', { productId: product.id, actorId })
    return product
  },

  async update(id: string, input: unknown, actorId: string) {
    const data = input as Prisma.ProductUpdateInput
    const product = await productsRepository.update(id, data)
    await eventBus.publish('product.updated', { productId: product.id, actorId })
    return product
  },

  async delete(id: string, actorId: string) {
    await productsRepository.delete(id)
    await eventBus.publish('product.deleted', { productId: id, actorId })
  },
}
