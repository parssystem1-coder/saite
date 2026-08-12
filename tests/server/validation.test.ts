import { describe, it, expect } from 'vitest'
import {
  createOrderSchema,
  couponCreateSchema,
  couponValidateSchema,
  productListFilterSchema,
  parseWithSchema,
  parseJsonBody,
} from '@/server/shared/validation'
import { ValidationError } from '@/server/shared/errors'

describe('لایهٔ اعتبارسنجی Zod — createOrderSchema', () => {
  const valid = {
    items: [{ productId: 'p1', quantity: 2 }],
    shippingAddress: { city: 'Tehran', street: 'Test St', zip: '1234567890' },
  }

  it('بدنهٔ معتبر را می‌پذیرد', () => {
    const out = parseWithSchema(createOrderSchema, valid)
    expect(out.items).toHaveLength(1)
    expect(out.shippingAddress.city).toBe('Tehran')
  })

  it('سبد خالی را رد می‌کند', () => {
    expect(() => parseWithSchema(createOrderSchema, { items: [], shippingAddress: {} })).toThrow(
      ValidationError
    )
  })

  it('quantity بیشتر از سقف را رد می‌کند', () => {
    expect(() =>
      parseWithSchema(createOrderSchema, {
        items: [{ productId: 'p1', quantity: 21 }],
        shippingAddress: {},
      })
    ).toThrow(ValidationError)
  })

  it('بیش از ۵۰ ردیف را رد می‌کند', () => {
    const items = Array.from({ length: 51 }, (_, i) => ({ productId: `p${i}`, quantity: 1 }))
    expect(() => parseWithSchema(createOrderSchema, { items, shippingAddress: {} })).toThrow(
      ValidationError
    )
  })

  it('آدرس با عمق نامحدود را رد می‌کند (دفاع در برابر JSON عمیق)', () => {
    // سه سطح تو در تو — schema فقط دو سطح مجاز است
    const deep = { a: { b: { c: 'x' } } }
    expect(() => parseWithSchema(createOrderSchema, { items: valid.items, shippingAddress: deep })).toThrow(
      ValidationError
    )
  })
})

describe('لایهٔ اعتبارسنجی Zod — couponCreateSchema', () => {
  it('کوپن معتبر را می‌پذیرد', () => {
    const out = parseWithSchema(couponCreateSchema, {
      code: 'SAVE10',
      name: 'ده درصد',
      type: 'percentage',
      value: 10,
    })
    expect(out.code).toBe('SAVE10')
  })

  it('نوع نامعتبر کوپن را رد می‌کند', () => {
    expect(() =>
      parseWithSchema(couponCreateSchema, { code: 'X', name: 'x', type: 'weird', value: 10 })
    ).toThrow(ValidationError)
  })

  it('value منفی را رد می‌کند', () => {
    expect(() =>
      parseWithSchema(couponCreateSchema, { code: 'X', name: 'x', type: 'fixed_amount', value: -5 })
    ).toThrow(ValidationError)
  })
})

describe('لایهٔ اعتبارسنجی Zod — couponValidateSchema', () => {
  it('orderAmount الزامی است', () => {
    expect(() => parseWithSchema(couponValidateSchema, { code: 'SAVE10' })).toThrow(ValidationError)
  })
})

describe('لایهٔ اعتبارسنجی Zod — productListFilterSchema', () => {
  it('inStock را به boolean درست تبدیل می‌کند', () => {
    const out = parseWithSchema(productListFilterSchema, { inStock: 'true' })
    expect(out.inStock).toBe(true)
  })

  it('minPrice نامعتبر را رد می‌کند', () => {
    expect(() => parseWithSchema(productListFilterSchema, { minPrice: 'abc' })).toThrow(ValidationError)
  })

  it('minPrice منفی را رد می‌کند', () => {
    expect(() => parseWithSchema(productListFilterSchema, { minPrice: '-5' })).toThrow(ValidationError)
  })
})

describe('لایهٔ اعتبارسنجی Zod — parseJsonBody', () => {
  it('JSON نامعتبر را به ValidationError تبدیل می‌کند', async () => {
    const bad = new Request('http://localhost/api/x', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{not-json',
    })
    await expect(parseJsonBody(bad)).rejects.toThrow(ValidationError)
  })
})
