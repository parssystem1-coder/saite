import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { ValidationError, DomainError } from './errors'
import { logger } from './logger'
import { consumeRateLimit, getClientKey } from '@/lib/auth/server/rate-limit'

/**
 * فرمت استاندارد خطای API
 * تمام endpointها باید از این فرمت استفاده کنند
 */
interface ApiError {
  error: string
  code?: string
  details?: unknown
}

/**
 * تبدیل خطای service به پاسخ HTTP استاندارد
 *
 * فرمت خروجی:
 * {
 *   error: string,        // پیام خطا برای نمایش به کاربر
 *   code?: string,        // کد خطا برای پردازش در کلاینت
 *   details?: unknown     // جزئیات اضافی (مثلاً validation errors)
 * }
 *
 * تمام خطاهای دامنه‌ای از DomainError extend می‌کنند و status/code دارند.
 * اگر خطا DomainError نباشد، 500 INTERNAL_ERROR برگردانده می‌شود.
 */
export function handleServiceError(err: unknown): NextResponse<ApiError> {
  // خطاهای دامنه‌ای — status و code از خود error
  if (err instanceof DomainError) {
    const response: ApiError = { error: err.message, code: err.code }
    // details فقط برای ValidationError
    if (err instanceof ValidationError) {
      response.details = err.details
    }
    return NextResponse.json(response, { status: err.status })
  }

  // خطاهای Prisma — تبدیل به پاسخ معنادار به‌جای ۵۰۰ خام
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // P2002 — unique constraint (مثل slug یا sku تکراری)
    if (err.code === 'P2002') {
      return NextResponse.json(
        { error: 'رکوردی با این مقدار از قبل وجود دارد', code: 'CONFLICT' },
        { status: 409 }
      )
    }
    // P2025 — رکورد یافت نشد
    if (err.code === 'P2025') {
      return NextResponse.json(
        { error: 'رکورد موردنظر یافت نشد', code: 'NOT_FOUND' },
        { status: 404 }
      )
    }
    logger.error({ err, code: err.code }, 'Prisma error')
    return NextResponse.json(
      { error: 'خطای پایگاه داده', code: 'DATABASE_ERROR' },
      { status: 500 }
    )
  }

  // خطاهای ناشناخته
  logger.error({ err }, 'Unhandled API error')
  return NextResponse.json(
    { error: 'خطای سرور', code: 'INTERNAL_ERROR' },
    { status: 500 }
  )
}

/**
 * Parse و validate پارامترهای pagination
 *
 * @param searchParams - URL search params
 * @param defaultPerPage - مقدار پیش‌فرض perPage (پیش‌فرض: 9)
 * @param maxPerPage - حداکثر مجاز perPage (پیش‌فرض: 100)
 *
 * @returns { page, perPage } - مقادیر validated و clamped
 *
 * @throws ValidationError - اگر page یا perPage نامعتبر باشند
 */
export function parsePagination(
  searchParams: URLSearchParams,
  defaultPerPage = 9,
  maxPerPage = 100
): { page: number; perPage: number } {
  let page = Number(searchParams.get('page') || '1')
  let perPage = Number(searchParams.get('perPage') || String(defaultPerPage))

  // Validation
  if (!Number.isFinite(page) || page < 1) {
    throw new ValidationError({ page: 'شماره صفحه باید عددی بزرگتر از ۰ باشد' })
  }

  if (!Number.isFinite(perPage) || perPage < 1) {
    perPage = defaultPerPage
  }

  // Clamp به محدوده مجاز
  perPage = Math.min(maxPerPage, Math.max(1, Math.floor(perPage)))
  page = Math.max(1, Math.floor(page))

  return { page, perPage }
}

/**
 * Parse پارامتر limit با سقف
 *
 * @param searchParams - URL search params
 * @param defaultLimit - مقدار پیش‌فرض limit (پیش‌فرض: 20)
 * @param maxLimit - حداکثر مجاز limit (پیش‌فرض: 100)
 *
 * @returns limit - مقدار validated و clamped
 */
export function parseLimit(
  searchParams: URLSearchParams,
  defaultLimit = 20,
  maxLimit = 100
): number {
  let limit = Number(searchParams.get('limit') || String(defaultLimit))

  if (!Number.isFinite(limit) || limit < 1) {
    limit = defaultLimit
  }

  return Math.min(maxLimit, Math.max(1, Math.floor(limit)))
}

/**
 * Rate-limit برای mutation endpoints (POST/PUT/PATCH/DELETE)
 *
 * @param req - NextRequest
 * @param prefix - پیشوند کلید (مثلاً 'order-create', 'upload')
 * @param maxAttempts - حداکثر تلاش در پنجره (پیش‌فرض: 30)
 * @param windowMs - طول پنجره به میلی‌ثانیه (پیش‌فرض: 60000 = 1 دقیقه)
 *
 * @returns null اگر مجاز است، یا NextResponse با 429 اگر محدود شده
 */
export async function checkMutationRateLimit(
  req: NextRequest,
  prefix: string,
  maxAttempts = 30,
  windowMs = 60_000
): Promise<NextResponse | null> {
  const clientKey = getClientKey(req.headers)
  const limit = await consumeRateLimit(`mutation:${prefix}:${clientKey}`, maxAttempts, windowMs)

  if (!limit.allowed) {
    logger.warn({ prefix, clientKey }, 'Mutation rate limit exceeded')
    const res = NextResponse.json(
      {
        error: 'درخواست بیش از حد مجاز است. لطفاً کمی صبر کنید.',
        code: 'RATE_LIMIT_EXCEEDED'
      },
      { status: 429 }
    )
    res.headers.set('Retry-After', String(limit.retryAfterSeconds))
    return res
  }

  return null
}

/**
 * Parse پارامتر عددی از URL
 *
 * @param value - مقدار string از URL
 * @param fieldName - نام فیلد برای پیام خطا
 *
 * @returns عدد parsed یا undefined اگر null/empty باشد
 *
 * @throws ValidationError - اگر مقدار نامعتبر باشد
 */
export function parseNumberParam(
  value: string | null,
  fieldName: string
): number | undefined {
  if (value === null || value === '' || value === undefined) {
    return undefined
  }

  const num = Number(value)
  if (!Number.isFinite(num)) {
    throw new ValidationError({
      [fieldName]: `${fieldName} باید عدد معتبر باشد`
    })
  }

  return num
}
