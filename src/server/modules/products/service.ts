import 'server-only'
import { productsRepository, type CreateProductData, type UpdateProductData } from './repository'
import { eventBus } from '@/server/shared/event-bus'
import { ProductEvents } from '@/server/shared/event-types'
import { cacheAside, cacheInvalidateByPrefix } from '@/server/shared/cache'
import { NotFoundError } from '@/server/shared/errors'
import type { ProductListQuery, ProductListResult } from '@/lib/api-types'
import {
  DEFAULT_PER_PAGE,
  MAX_PER_PAGE,
  SITEMAP_MAX_PER_PAGE,
  PRODUCTS_LIST_TTL,
} from '@/server/shared/constants'

/**
 * ساخت کلید cache از query parameters
 */
function buildCacheKey(query: ProductListQuery, fields?: 'slug'): string {
  const parts: string[] = []

  if (query.q) parts.push(`q:${query.q}`)
  if (query.category) parts.push(`cat:${query.category}`)
  if (query.subCategory) parts.push(`sub:${query.subCategory}`)
  if (query.brand) parts.push(`brand:${query.brand}`)
  if (query.technology) parts.push(`tech:${query.technology}`)
  if (query.usage) parts.push(`usage:${query.usage}`)
  if (query.color) parts.push(`color:${query.color}`)
  if (query.inStock) parts.push(`inStock:1`)
  if (query.minPrice) parts.push(`minPrice:${query.minPrice}`)
  if (query.maxPrice) parts.push(`maxPrice:${query.maxPrice}`)
  if (query.sort) parts.push(`sort:${query.sort}`)

  const page = query.page ?? 1
  const perPage = query.perPage ?? DEFAULT_PER_PAGE
  parts.push(`p:${page}`, `pp:${perPage}`)
  if (fields === 'slug') parts.push('fields:slug')

  return parts.join('|')
}

export const productsService = {
  async getList(query: ProductListQuery = {}, fields?: 'slug'): Promise<ProductListResult> {
    const page = Math.max(1, query.page ?? 1)
    const maxPerPage = fields === 'slug' ? SITEMAP_MAX_PER_PAGE : MAX_PER_PAGE
    const perPage = Math.min(maxPerPage, Math.max(1, query.perPage ?? DEFAULT_PER_PAGE))
    const cacheKey = buildCacheKey({ ...query, page, perPage }, fields)

    return cacheAside(
      cacheKey,
      async () => {
        const { items, total } = await productsRepository.list(query, page, perPage, fields)

        return {
          items: items as unknown as ProductListResult['items'],
          total,
          page,
          perPage,
          totalPages: Math.max(1, Math.ceil(total / perPage)),
        }
      },
      { ttl: PRODUCTS_LIST_TTL, prefix: 'products:list' }
    )
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

  async create(input: CreateProductData, actorId: string) {
    const product = await productsRepository.create(input)
    await eventBus.publish(ProductEvents.created, { productId: product.id, actorId })

    // Invalidate cache لیست محصولات
    await cacheInvalidateByPrefix('products:list')

    return product
  },

  async update(id: string, input: UpdateProductData, actorId: string) {
    const product = await productsRepository.update(id, input)
    await eventBus.publish(ProductEvents.updated, { productId: product.id, actorId })

    // Invalidate cache لیست محصولات
    await cacheInvalidateByPrefix('products:list')

    return product
  },

  async delete(id: string, actorId: string) {
    await productsRepository.delete(id)
    await eventBus.publish(ProductEvents.deleted, { productId: id, actorId })

    // Invalidate cache لیست محصولات
    await cacheInvalidateByPrefix('products:list')
  },
}
