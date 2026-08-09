import 'server-only'
import { z } from 'zod'
import { ValidationError } from './errors'

/**
 * اعتبارسنجی ورودی HTTP با Zod — لایه مرزی
 *
 * هر Route Handler باید ورودی (query/body) را قبل از صدا زدن service
 * با یک schema اعتبارسنجی کند و در صورت خطا ValidationError (۴۰۰) بدهد.
 * این لایه تضمین می‌کند هیچ `unknown → as never` به Prisma نرسد.
 */

// ── صفحه‌بندی ──────────────────────────────────────────────

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(9),
})

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  perPage: z.coerce.number().int().min(1).max(100).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
})

// ── محصولات ───────────────────────────────────────────────

export const productListQuerySchema = z.object({
  q: z.string().max(100).optional(),
  category: z.string().max(50).optional(),
  subCategory: z.string().max(50).optional(),
  brand: z.string().max(50).optional(),
  technology: z.string().max(50).optional(),
  usage: z.string().max(50).optional(),
  color: z.string().max(50).optional(),
  inStock: z.coerce.boolean().optional(),
  minPrice: z.coerce.number().int().min(0).optional(),
  maxPrice: z.coerce.number().int().min(0).optional(),
  sort: z.enum(['newest', 'price_asc', 'price_desc', 'best_selling']).optional(),
  page: z.coerce.number().int().min(1).optional(),
  perPage: z.coerce.number().int().min(1).max(100).optional(),
})

export const productCreateSchema = z.object({
  slug: z.string().min(1).max(100),
  name: z.string().min(1).max(200),
  brand: z.string().min(1).max(100),
  model: z.string().min(1).max(100),
  sku: z.string().min(1).max(100),
  category: z.string().min(1).max(50),
  priceType: z.enum(['fixed', 'quote_only']),
  price: z.number().int().min(0).nullable().optional(),
  stockStatus: z.enum(['in_stock', 'low_stock', 'out_of_stock', 'on_request']).optional(),
  images: z.array(z.string().url()).optional(),
  shortDescription: z.string().min(1).max(1000),
})

// ── سفارش ─────────────────────────────────────────────────

export const createOrderSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().int().min(1).max(20),
      })
    )
    .min(1)
    .max(50),
  shippingAddress: z.record(z.string(), z.unknown()),
})

// ── کوپن ──────────────────────────────────────────────────

export const couponCreateSchema = z.object({
  code: z.string().min(1).max(50),
  name: z.string().min(1).max(100),
  type: z.enum(['percentage', 'fixed_amount', 'free_shipping']),
  value: z.number().int().min(0),
  minOrderAmount: z.number().int().min(0).optional(),
  usageLimit: z.number().int().min(1).nullable().optional(),
  perCustomerLimit: z.number().int().min(1).optional(),
})

// ── helper ─────────────────────────────────────────────────

export function parseWithSchema<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data)
  if (!result.success) {
    throw new ValidationError(result.error.flatten())
  }
  return result.data
}
