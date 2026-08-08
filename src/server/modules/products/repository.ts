import 'server-only'
import { prisma } from '@/server/shared/db'
import type { ProductListQuery } from '@/lib/api-types'

export const productsRepository = {
  async findBySlug(slug: string) {
    return prisma.product.findUnique({ where: { slug } })
  },

  async findById(id: string) {
    return prisma.product.findUnique({ where: { id } })
  },

  async list(query: ProductListQuery, page: number, perPage: number) {
    const where = buildWhere(query)

    const [items, total] = await prisma.$transaction([
      prisma.product.findMany({
        where,
        skip: (page - 1) * perPage,
        take: perPage,
        orderBy: orderBy(query.sort),
      }),
      prisma.product.count({ where }),
    ])

    return { items, total }
  },

  async create(data: Record<string, unknown>) {
    return prisma.product.create({ data: data as never })
  },

  async update(id: string, data: Record<string, unknown>) {
    return prisma.product.update({ where: { id }, data: data as never })
  },

  async delete(id: string) {
    return prisma.product.delete({ where: { id } })
  },

  // TODO: pgvector — فاز ۵ (semantic search)
  // async findSimilar(embedding: number[], limit = 10) { ... }
}

function buildWhere(query: ProductListQuery) {
  const where: Record<string, unknown> = {}

  if (query.q) {
    where.OR = [
      { name: { contains: query.q, mode: 'insensitive' } },
      { model: { contains: query.q, mode: 'insensitive' } },
      { sku: { contains: query.q, mode: 'insensitive' } },
      { brand: { contains: query.q, mode: 'insensitive' } },
    ]
  }

  if (query.category && query.category !== 'all') {
    where.category = query.category
  }

  if (query.subCategory && query.subCategory !== 'all') {
    where.subCategory = query.subCategory
  }

  if (query.brand && query.brand !== 'all') {
    where.brand = query.brand
  }

  if (query.technology && query.technology !== 'all') {
    where.technology = query.technology
  }

  if (query.usage && query.usage !== 'all') {
    where.usageClass = query.usage
  }

  if (query.color && query.color !== 'all') {
    where.colorSupport = query.color
  }

  if (query.inStock) {
    where.stockStatus = { not: 'out_of_stock' }
  }

  if (query.minPrice !== undefined || query.maxPrice !== undefined) {
    where.price = {}
    if (query.minPrice !== undefined) (where.price as Record<string, unknown>).gte = query.minPrice
    if (query.maxPrice !== undefined) (where.price as Record<string, unknown>).lte = query.maxPrice
  }

  return where
}

function orderBy(sort?: string) {
  switch (sort) {
    case 'price_asc':
      return { price: 'asc' }
    case 'price_desc':
      return { price: 'desc' }
    case 'best_selling':
      return { isBestSeller: 'desc' }
    default:
      return { createdAt: 'desc' }
  }
}
