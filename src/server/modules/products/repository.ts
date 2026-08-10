import 'server-only'
import { prisma } from '@/server/shared/db'
import type { ProductListQuery } from '@/lib/api-types'
import type { PriceType, StockStatus, ProductCondition } from '@/types/product'

export interface CreateProductData {
  slug: string
  name: string
  brand: string
  model: string
  sku: string
  category: string
  subCategory?: string | null
  priceType: PriceType
  price?: number | null
  compareAtPrice?: number | null
  stockStatus?: StockStatus
  images?: string[]
  shortDescription: string
  description?: string | null
  keyFeatures?: string[]
  specs?: Record<string, unknown> | null
  technology?: string | null
  colorSupport?: string | null
  usageClass?: string | null
  warrantyMonths?: number | null
  condition?: ProductCondition
  compatibleWith?: string[]
  consumables?: string[]
  isFeatured?: boolean
  isBestSeller?: boolean
}

export type UpdateProductData = Partial<CreateProductData>

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

  async create(data: CreateProductData) {
    return prisma.product.create({ data })
  },

  async update(id: string, data: UpdateProductData) {
    return prisma.product.update({ where: { id }, data })
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

  // برای سازگاری با src/lib/api.ts — featured/bestSeller
  const qAny = query as unknown as Record<string, unknown>
  if (qAny.isFeatured) where.isFeatured = true
  if (qAny.isBestSeller) where.isBestSeller = true

  if (query.minPrice !== undefined || query.maxPrice !== undefined) {
    const priceFilter: Record<string, unknown> = {}
    if (query.minPrice !== undefined) priceFilter.gte = query.minPrice
    if (query.maxPrice !== undefined) priceFilter.lte = query.maxPrice
    where.price = priceFilter
  }

  return where
}

function orderBy(sort?: string) {
  switch (sort) {
    case 'price_asc':
      return { price: 'asc' as const }
    case 'price_desc':
      return { price: 'desc' as const }
    case 'best_selling':
      return { isBestSeller: 'desc' as const }
    default:
      return { createdAt: 'desc' as const }
  }
}
