import 'server-only'
import { Prisma } from '@prisma/client'
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
    return prisma.product.create({ data: toCreateInput(data) })
  },

  async update(id: string, data: UpdateProductData) {
    return prisma.product.update({ where: { id }, data: toUpdateInput(data) })
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

/** Json nullable → Prisma.DbNull برای null (SQL NULL) یا InputJsonValue */
function toJsonOrNull(
  specs: Record<string, unknown> | null | undefined
): Prisma.InputJsonValue | typeof Prisma.DbNull | undefined {
  if (specs === null) return Prisma.DbNull
  if (specs === undefined) return undefined
  return specs as Prisma.InputJsonValue
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

/** نگاشت دادهٔ ورودی به Prisma.ProductCreateInput — بدون هیچ `as any` */
function toCreateInput(data: CreateProductData): Prisma.ProductCreateInput {
  return {
    slug: data.slug,
    name: data.name,
    brand: data.brand,
    model: data.model,
    sku: data.sku,
    category: data.category,
    subCategory: data.subCategory ?? null,
    priceType: data.priceType,
    price: data.price ?? null,
    compareAtPrice: data.compareAtPrice ?? null,
    stockStatus: data.stockStatus,
    images: data.images,
    shortDescription: data.shortDescription,
    description: data.description ?? null,
    keyFeatures: data.keyFeatures,
    specs: toJsonOrNull(data.specs),
    technology: data.technology ?? null,
    colorSupport: data.colorSupport ?? null,
    usageClass: data.usageClass ?? null,
    warrantyMonths: data.warrantyMonths ?? null,
    condition: data.condition,
    compatibleWith: data.compatibleWith,
    consumables: data.consumables,
    isFeatured: data.isFeatured,
    isBestSeller: data.isBestSeller,
  }
}

/** نگاشت دادهٔ به‌روزرسانی به Prisma.ProductUpdateInput — بدون هیچ `as any` */
function toUpdateInput(data: UpdateProductData): Prisma.ProductUpdateInput {
  const input: Prisma.ProductUpdateInput = {}
  if (data.slug !== undefined) input.slug = data.slug
  if (data.name !== undefined) input.name = data.name
  if (data.brand !== undefined) input.brand = data.brand
  if (data.model !== undefined) input.model = data.model
  if (data.sku !== undefined) input.sku = data.sku
  if (data.category !== undefined) input.category = data.category
  if (data.subCategory !== undefined) input.subCategory = data.subCategory
  if (data.priceType !== undefined) input.priceType = data.priceType
  if (data.price !== undefined) input.price = data.price
  if (data.compareAtPrice !== undefined) input.compareAtPrice = data.compareAtPrice
  if (data.stockStatus !== undefined) input.stockStatus = data.stockStatus
  if (data.images !== undefined) input.images = data.images
  if (data.shortDescription !== undefined) input.shortDescription = data.shortDescription
  if (data.description !== undefined) input.description = data.description
  if (data.keyFeatures !== undefined) input.keyFeatures = data.keyFeatures
  if (data.specs !== undefined) input.specs = toJsonOrNull(data.specs)
  if (data.technology !== undefined) input.technology = data.technology
  if (data.colorSupport !== undefined) input.colorSupport = data.colorSupport
  if (data.usageClass !== undefined) input.usageClass = data.usageClass
  if (data.warrantyMonths !== undefined) input.warrantyMonths = data.warrantyMonths
  if (data.condition !== undefined) input.condition = data.condition
  if (data.compatibleWith !== undefined) input.compatibleWith = data.compatibleWith
  if (data.consumables !== undefined) input.consumables = data.consumables
  if (data.isFeatured !== undefined) input.isFeatured = data.isFeatured
  if (data.isBestSeller !== undefined) input.isBestSeller = data.isBestSeller
  return input
}
