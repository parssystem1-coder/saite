import { describe, expect, it } from 'vitest'
import { paginationSchema, productListQuerySchema, parseWithSchema } from '@/server/shared/validation'
import { ValidationError } from '@/server/shared/errors'

describe('validation', () => {
  it('paginationSchema پیش‌فرض‌ها را می‌دهد', () => {
    const result = paginationSchema.parse({})
    expect(result.page).toBe(1)
    expect(result.perPage).toBe(9)
  })

  it('perPage بیش از ۱۰۰ خطا می‌دهد', () => {
    expect(() => paginationSchema.parse({ perPage: 200 })).toThrow()
  })

  it('page منفی خطا می‌دهد', () => {
    expect(() => paginationSchema.parse({ page: -1 })).toThrow()
  })

  it('minPrice نامعتبر خطا می‌دهد', () => {
    expect(() => productListQuerySchema.parse({ minPrice: -1 })).toThrow()
  })

  it('sort نامعتبر خطا می‌دهد', () => {
    expect(() => productListQuerySchema.parse({ sort: 'invalid' as never })).toThrow()
  })

  it('parseWithSchema خطا را به ValidationError تبدیل می‌کند', () => {
    expect(() => parseWithSchema(paginationSchema, { perPage: 200 })).toThrow(ValidationError)
  })

  it('parseWithSchema مقدار معتبر را برمی‌گرداند', () => {
    const result = parseWithSchema(paginationSchema, { page: 2, perPage: 20 })
    expect(result.page).toBe(2)
    expect(result.perPage).toBe(20)
  })
})
