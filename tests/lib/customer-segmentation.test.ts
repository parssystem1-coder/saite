import { describe, expect, it } from 'vitest'
import { deriveCustomerSegments } from '@/lib/customers/customer-segmentation'

describe('customer segmentation', () => {
  it('vip for high lifetime value', () => {
    const segs = deriveCustomerSegments({
      orderCount: 5,
      lifetimeValue: 300_000_000,
      lastOrderAt: new Date().toISOString(),
      companyName: undefined,
      status: 'active',
    })
    expect(segs).toContain('vip')
  })

  it('repeat_buyer for 3+ orders', () => {
    const segs = deriveCustomerSegments({
      orderCount: 3,
      lifetimeValue: 1000000,
      lastOrderAt: new Date().toISOString(),
      companyName: undefined,
      status: 'active',
    })
    expect(segs).toContain('repeat_buyer')
  })

  it('business when companyName present', () => {
    const segs = deriveCustomerSegments({
      orderCount: 1,
      lifetimeValue: 1000000,
      lastOrderAt: new Date().toISOString(),
      companyName: 'شرکت پارسیان',
      status: 'active',
    })
    expect(segs).toContain('business')
  })

  it('at_risk when last order >90 days ago', () => {
    const old = new Date(Date.now() - 100 * 86400000).toISOString()
    const segs = deriveCustomerSegments({
      orderCount: 2,
      lifetimeValue: 5000000,
      lastOrderAt: old,
      companyName: undefined,
      status: 'active',
    })
    expect(segs).toContain('at_risk')
  })

  it('at_risk when blocked', () => {
    const segs = deriveCustomerSegments({
      orderCount: 10,
      lifetimeValue: 1000000,
      lastOrderAt: new Date().toISOString(),
      companyName: undefined,
      status: 'blocked',
    })
    expect(segs).toEqual(['at_risk'])
  })

  it('no_purchase when zero orders', () => {
    const segs = deriveCustomerSegments({
      orderCount: 0,
      lifetimeValue: 0,
      lastOrderAt: undefined,
      companyName: undefined,
      status: 'active',
    })
    expect(segs).toContain('no_purchase')
  })

  it('new when no other segment matches', () => {
    const segs = deriveCustomerSegments({
      orderCount: 1,
      lifetimeValue: 100000,
      lastOrderAt: new Date().toISOString(),
      companyName: undefined,
      status: 'active',
    })
    // single order, low value, recent → no vip/repeat/business/at_risk/no_purchase
    expect(segs).toContain('new')
  })
})
