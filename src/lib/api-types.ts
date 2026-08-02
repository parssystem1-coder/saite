import type { ProductFilters } from '@/lib/product-filters'
import type { Product } from '@/types/product'

/**
 * قرارداد پاسخ/ورودی لایهٔ داده.
 * UI فقط با این تایپ‌ها حرف می‌زند — نه با mock و نه با شکل خام HTTP.
 */

/** کوئری فهرست محصولات (فیلتر + صفحه) */
export type ProductListQuery = ProductFilters & {
  page?: number
  perPage?: number
}

/** پاسخ صفحه‌بندی‌شدهٔ فهرست */
export type ProductListResult = {
  items: Product[]
  total: number
  page: number
  perPage: number
  totalPages: number
}

/**
 * خطای استاندارد API — در فاز HTTP از status واقعی پر می‌شود.
 * UI می‌تواند message را به کاربر نشان دهد.
 */
export class ApiError extends Error {
  readonly status: number
  readonly code?: string

  constructor(status: number, message: string, code?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}
