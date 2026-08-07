import { describe, expect, it } from 'vitest'
import { isMethodEligible, quoteShipping } from '@/lib/shipping/eligibility'
import type { ShippingMethod } from '@/types/shipping'

const base: ShippingMethod = {
  id: 'm',
  name: 'پست',
  carrierId: 'post',
  serviceName: 'پیشتاز',
  paymentMode: 'prepaid',
  pricingModel: 'flat_rate',
  flatRate: 85000,
  zones: ['z'],
  estimatedMinDays: 2,
  estimatedMaxDays: 3,
  customerLabel: 'پست پیشتاز',
  customerDescription: 'تحویل ۲ تا ۳ روزه',
  active: true,
  priority: 1,
  createdAt: '',
  updatedAt: '',
}

const ctx = {
  orderTotal: 1000000,
  itemCount: 1,
  weightGrams: 2000,
  province: 'تهران',
  city: 'تهران',
  categorySlugs: ['printer'],
  customerSegments: ['new'],
  carrierSupportsCashOnDelivery: true,
}

describe('shipping', () => {
  it('quotes flat prepaid', () => {
    expect(quoteShipping(base, ctx).customerPayable).toBe(85000)
  })

  it('rejects overweight', () => {
    expect(isMethodEligible({ ...base, maxWeightGrams: 1000 }, ctx)).toBe(false)
  })

  it('rejects category mismatch', () => {
    expect(
      isMethodEligible({ ...base, allowedCategories: ['toner'] }, ctx)
    ).toBe(false)
    expect(
      isMethodEligible({ ...base, allowedCategories: ['printer'] }, ctx)
    ).toBe(true)
  })

  it('cash on delivery customer payable is zero', () => {
    expect(
      quoteShipping(
        { ...base, paymentMode: 'cash_on_delivery', pricingModel: 'carrier_rate', baseRate: 120000 },
        ctx
      ).customerPayable
    ).toBe(0)
  })

  it('inactive method is not eligible', () => {
    expect(isMethodEligible({ ...base, active: false }, ctx)).toBe(false)
  })

  it('free payment mode is eligible and quote is zero', () => {
    const free = { ...base, paymentMode: 'free' as const, pricingModel: 'free' as const }
    expect(isMethodEligible(free, ctx)).toBe(true)
    expect(quoteShipping(free, ctx).customerPayable).toBe(0)
  })
})
