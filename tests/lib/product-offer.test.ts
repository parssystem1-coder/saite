import { describe, expect, it } from 'vitest'
import { tomanToRial } from '@/lib/money'
import {
  buildProductOfferLd,
  resolveOfferPriceToman,
  schemaAvailabilityUrl,
} from '@/lib/seo/product-offer'
import { buildProductSchema } from '@/components/admin/products/product-editor.utils'
import { INITIAL_DRAFT } from '@/components/admin/products/product-editor.constants'

describe('tomanToRial', () => {
  it('تومان را در ۱۰ ضرب می‌کند', () => {
    expect(tomanToRial(72_000_000)).toBe(720_000_000)
    expect(tomanToRial('')).toBe(0)
  })
})

describe('buildProductOfferLd', () => {
  it('قیمت تومان را به ریال رشته‌ای تبدیل می‌کند', () => {
    const offers = buildProductOfferLd({
      priceToman: 72_000_000,
      stockStatus: 'in_stock',
      condition: 'new',
    })
    expect(offers).toEqual({
      '@type': 'Offer',
      priceCurrency: 'IRR',
      price: '720000000',
      availability: 'https://schema.org/InStock',
      itemCondition: 'https://schema.org/NewCondition',
    })
  })

  it('قیمت تخفیف را بر قیمت مصرف‌کننده ترجیح می‌دهد', () => {
    const offers = buildProductOfferLd({
      priceToman: 80_000_000,
      salePriceToman: 72_000_000,
      stockStatus: 'in_stock',
    })
    expect(offers?.price).toBe('720000000')
  })

  it('بدون قیمت معتبر، Offer نمی‌سازد', () => {
    expect(buildProductOfferLd({ priceToman: '', stockStatus: 'in_stock' })).toBeUndefined()
    expect(buildProductOfferLd({ priceToman: 0, stockStatus: 'in_stock' })).toBeUndefined()
  })

  it('availability را URL خام schema.org می‌گذارد نه لینک مارک‌داون', () => {
    const url = schemaAvailabilityUrl('in_stock')
    expect(url).toBe('https://schema.org/InStock')
    expect(url).not.toContain('[')
    expect(url).not.toContain('](')
  })

  it('پیش‌سفارش و ناموجود را درست نگاشت می‌کند', () => {
    expect(schemaAvailabilityUrl('pre_order')).toBe('https://schema.org/PreOrder')
    expect(schemaAvailabilityUrl('out_of_stock')).toBe('https://schema.org/OutOfStock')
    expect(schemaAvailabilityUrl('low_stock')).toBe('https://schema.org/LimitedAvailability')
  })
})

describe('buildProductSchema offers', () => {
  it('با وارد کردن قیمت، offers را خودکار پر می‌کند', () => {
    const schema = buildProductSchema(
      { ...INITIAL_DRAFT, priceToman: 72_000_000, stockStatus: 'in_stock' },
      [],
      []
    )
    const offers = schema.offers as Record<string, unknown>
    expect(offers.price).toBe('720000000')
    expect(offers.priceCurrency).toBe('IRR')
    expect(offers.availability).toBe('https://schema.org/InStock')
  })

  it('بدون قیمت، بلوک offers را حذف می‌کند', () => {
    const schema = buildProductSchema(INITIAL_DRAFT, [], [])
    expect(schema.offers).toBeUndefined()
  })
})

describe('resolveOfferPriceToman', () => {
  it('تخفیف صفر را نادیده می‌گیرد', () => {
    expect(resolveOfferPriceToman(1_000_000, 0)).toBe(1_000_000)
    expect(resolveOfferPriceToman(1_000_000, '')).toBe(1_000_000)
  })
})
