import { describe, expect, it } from 'vitest'
import {
  addMoney,
  assertIdempotencyKey,
  assertOrderTotals,
  canTransitionReservation,
  customerShippingMessage,
  toPaymentMethod,
  toShippingPaymentMode,
} from '@/lib/domain/commerce-rules'
import type { Money, OrderSnapshot } from '@/domain/commerce'

function money(amount: number, currency: 'IRT' | 'IRR' = 'IRT'): Money {
  return { amount, currency }
}

describe('commerce rules', () => {
  it('adds same currency', () => {
    expect(addMoney(money(2), money(3)).amount).toBe(5)
  })

  it('rejects currency mismatch', () => {
    expect(() => addMoney(money(2, 'IRT'), money(3, 'IRR'))).toThrow('CURRENCY_MISMATCH')
  })

  it('enforces reservation lifecycle', () => {
    expect(canTransitionReservation('held', 'confirmed')).toBe(true)
    expect(canTransitionReservation('released', 'confirmed')).toBe(false)
    expect(canTransitionReservation('held', 'expired')).toBe(true)
    expect(canTransitionReservation('confirmed', 'released')).toBe(true)
  })

  it('makes COD explicit', () => {
    expect(customerShippingMessage('cash_on_delivery', 'پست')).toContain('هنگام تحویل')
    expect(customerShippingMessage('free', 'پست')).toContain('فروشگاه')
    expect(customerShippingMessage('prepaid', 'پست')).toContain('ثبت سفارش')
  })

  it('checks idempotency', () => {
    expect(() => assertIdempotencyKey('short')).toThrow()
    expect(() => assertIdempotencyKey('checkout:2026:customer:abc123')).not.toThrow()
    expect(() => assertIdempotencyKey('order:1234567890123456')).not.toThrow()
  })

  it('checks order totals with real fixture (no as never)', () => {
    const order: Pick<OrderSnapshot, 'lines' | 'subtotal' | 'discountTotal' | 'shipping' | 'grandTotal'> = {
      lines: [
        {
          id: 'line-1',
          productId: 'p1',
          sku: 'SKU-1',
          name: 'پرینتر',
          quantity: 2,
          unitPrice: money(50000),
          discount: money(0),
          lineTotal: money(100000),
        },
        {
          id: 'line-2',
          productId: 'p2',
          sku: 'SKU-2',
          name: 'تونر',
          quantity: 1,
          unitPrice: money(30000),
          discount: money(0),
          lineTotal: money(30000),
        },
      ],
      subtotal: money(130000),
      discountTotal: money(10000),
      shipping: {
        methodId: 'post',
        carrierId: 'post',
        serviceName: 'پست پیشتاز',
        paymentMode: 'prepaid',
        customerPayable: money(20000),
        carrierCost: money(25000),
        storeSubsidy: money(5000),
        insurance: money(0),
        packagingFee: money(0),
        quoteId: 'q1',
        quotedAt: new Date().toISOString(),
        label: 'پست پیشتاز',
      },
      grandTotal: money(140000), // 130000 -10000 +20000
    }

    expect(() => assertOrderTotals(order)).not.toThrow()

    // عمداً اشتباه: grandTotal نادرست → باید خطا دهد
    const wrong: typeof order = { ...order, grandTotal: money(999999) }
    expect(() => assertOrderTotals(wrong)).toThrow('ORDER_TOTALS_MISMATCH')
  })

  it('maps cod ↔ cash_on_delivery correctly (boundary mapper)', () => {
    expect(toShippingPaymentMode('cod')).toBe('cash_on_delivery')
    expect(toShippingPaymentMode('cash_on_delivery')).toBe('cash_on_delivery')
    expect(toShippingPaymentMode('online')).toBe('prepaid')
    expect(toPaymentMethod('cash_on_delivery')).toBe('cod')
    expect(toPaymentMethod('prepaid')).toBe('online')
    expect(toPaymentMethod('free')).toBe('online')
  })
})
