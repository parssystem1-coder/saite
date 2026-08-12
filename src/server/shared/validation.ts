import 'server-only'
import { z } from 'zod'
import { ValidationError } from './errors'

/**
 * اعتبارسنجی ورودی HTTP با Zod — لایه مرزی
 *
 * هر Route Handler باید ورودی (query/body) را قبل از صدا زدن service
 * با یک schema اعتبارسنجی کند و در صورت خطا ValidationError (۴۰۰) بدهد.
 * این لایه تضمین می‌کند هیچ `unknown → as never` به Prisma نرسد.
 *
 * همهٔ Json های ورودی (`shippingAddress`, `metadata`, `specs`) در اینجا
 * با عمق/طول محدود می‌شوند تا هم DoS نشوند و هم حجمشان قابل پیش‌بینی باشد.
 */

// ── اسکالرها و helpers مشترک ─────────────────────────────

/** بولی query-string: فقط true/false/1/0 — مقدار نامعتبر → undefined */
const boolQuery = z
  .enum(['true', 'false', '1', '0'])
  .optional()
  .transform((v) => (v === undefined ? undefined : v === 'true' || v === '1'))

/** تاریخ ISO/قابل-coerce — به Date تبدیل می‌شود */
const isoDate = z.coerce.date()

/** رکورد Json ورودی با کلید و عمق محدود (دو سطح) — جلوگیری از JSON عمیق */
const jsonScalar = z.union([z.string().max(1000), z.number(), z.boolean(), z.null()])
const jsonValue = z.union([
  jsonScalar,
  z.array(jsonScalar).max(100),
  z.record(z.string().max(64), jsonScalar),
])
const jsonRecord = z.record(z.string().max(64), jsonValue)

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
  inStock: boolQuery,
  minPrice: z.coerce.number().int().min(0).optional(),
  maxPrice: z.coerce.number().int().min(0).optional(),
  sort: z.enum(['newest', 'price_asc', 'price_desc', 'best_selling']).optional(),
  page: z.coerce.number().int().min(1).optional(),
  perPage: z.coerce.number().int().min(1).max(100).optional(),
})

/** بدون page/perPage — برای فیلتر صرف (page/perPage جدا parse می‌شود) */
export const productListFilterSchema = productListQuerySchema.omit({
  page: true,
  perPage: true,
})

/** اعلام متادیتای محصول — برای GET/POST/PATCH */
export const productWriteSchema = z.object({
  slug: z.string().min(1).max(100),
  name: z.string().min(1).max(200),
  brand: z.string().min(1).max(100),
  model: z.string().min(1).max(100),
  sku: z.string().min(1).max(100),
  category: z.string().min(1).max(50),
  subCategory: z.string().max(50).nullable().optional(),
  priceType: z.enum(['fixed', 'quote_only']),
  price: z.number().int().min(0).nullable().optional(),
  compareAtPrice: z.number().int().min(0).nullable().optional(),
  stockStatus: z.enum(['in_stock', 'low_stock', 'out_of_stock', 'on_request']).optional(),
  images: z.array(z.string().max(500)).max(20).optional(),
  shortDescription: z.string().min(1).max(1000),
  description: z.string().max(20000).nullable().optional(),
  keyFeatures: z.array(z.string().max(200)).max(100).optional(),
  specs: jsonRecord.nullable().optional(),
  technology: z.string().max(50).nullable().optional(),
  colorSupport: z.string().max(50).nullable().optional(),
  usageClass: z.string().max(50).nullable().optional(),
  warrantyMonths: z.number().int().min(0).nullable().optional(),
  condition: z.enum(['new', 'refurbished']).optional(),
  compatibleWith: z.array(z.string().max(100)).max(200).optional(),
  consumables: z.array(z.string().max(100)).max(200).optional(),
  isFeatured: z.boolean().optional(),
  isBestSeller: z.boolean().optional(),
})

export const productCreateSchema = productWriteSchema
export const productUpdateSchema = productWriteSchema.partial()

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
  shippingAddress: jsonRecord,
})

// ── کوپن و کمپین ──────────────────────────────────────────

export const couponCreateSchema = z.object({
  code: z.string().min(1).max(50),
  name: z.string().min(1).max(100),
  description: z.string().max(500).nullable().optional(),
  type: z.enum(['percentage', 'fixed_amount', 'free_shipping']),
  value: z.number().int().min(0),
  minOrderAmount: z.number().int().min(0).optional(),
  maxDiscount: z.number().int().min(0).nullable().optional(),
  usageLimit: z.number().int().min(1).nullable().optional(),
  perCustomerLimit: z.number().int().min(1).optional(),
  startsAt: isoDate.nullable().optional(),
  expiresAt: isoDate.nullable().optional(),
  applicableProducts: z.array(z.string().max(100)).max(500).optional(),
  applicableCategories: z.array(z.string().max(100)).max(200).optional(),
  firstOrderOnly: z.boolean().optional(),
})

export const couponValidateSchema = z.object({
  code: z.string().min(1).max(50),
  orderAmount: z.number().int().min(0),
  customerId: z.string().max(100).optional(),
  productIds: z.array(z.string().max(100)).max(500).optional(),
  categoryIds: z.array(z.string().max(100)).max(200).optional(),
  isFirstOrder: z.boolean().optional(),
})

export const campaignCreateSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).nullable().optional(),
  type: z.string().min(1).max(50),
  startDate: isoDate,
  endDate: isoDate,
  bannerUrl: z.string().max(500).nullable().optional(),
  targetUrl: z.string().max(500).nullable().optional(),
  priority: z.number().int().min(0).optional(),
  metadata: jsonRecord.nullable().optional(),
})

// ── ارسال (Shipping) ───────────────────────────────────────

export const shipmentCreateSchema = z.object({
  orderId: z.string().min(1),
  carrier: z.string().min(1).max(50),
  trackingNumber: z.string().max(200).optional(),
  shippingCost: z.number().int().min(0).optional(),
  weightGrams: z.number().int().min(0).optional(),
  dimensions: z.string().max(50).optional(),
  originAddress: jsonRecord.nullable().optional(),
  destinationAddress: jsonRecord.nullable().optional(),
  estimatedDelivery: isoDate.optional(),
  notes: z.string().max(1000).optional(),
})

export const shipmentUpdateSchema = z.object({
  status: z.enum([
    'pending',
    'label_created',
    'picked_up',
    'in_transit',
    'out_for_delivery',
    'delivered',
    'failed',
    'returned',
  ]),
  shippedAt: isoDate.optional(),
  deliveredAt: isoDate.optional(),
  trackingNumber: z.string().max(200).optional(),
  notes: z.string().max(1000).optional(),
})

export const shippingRateCreateSchema = z.object({
  carrier: z.string().min(1).max(50),
  zone: z.string().min(1).max(50),
  minWeight: z.number().int().min(0).optional(),
  maxWeight: z.number().int().min(0).nullable().optional(),
  baseCost: z.number().int().min(0),
  perKgCost: z.number().int().min(0).optional(),
  codFee: z.number().int().min(0).optional(),
  estimatedDays: z.number().int().min(0).optional(),
})

// ── helper ها ──────────────────────────────────────────────

/**
 * اعتبارسنجی دادهٔ ناشناخته با schema — در صورت خطا ValidationError با جزئیات flatten
 */
export function parseWithSchema<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data)
  if (!result.success) {
    throw new ValidationError(result.error.flatten())
  }
  return result.data
}

/**
 * خواندن امن بدنهٔ JSON — خطای parse به ValidationError (۴۰۰) تبدیل می‌شود
 */
export async function parseJsonBody(req: Request): Promise<unknown> {
  try {
    return await req.json()
  } catch {
    throw new ValidationError({ body: 'بدنهٔ درخواست JSON معتبر نیست' })
  }
}
