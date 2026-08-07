import { describe, expect, it } from 'vitest'
import {
  assertPaymentAmount,
  assertRefundAmount,
  canTransitionPayment,
  chooseProvider,
  validateProvider,
} from '@/lib/payments/payment-rules'
import type { PaymentProvider } from '@/types/payment'

const p: PaymentProvider = {
  id: 'p',
  name: 'زرین',
  code: 'zarinpal',
  environment: 'sandbox',
  active: true,
  priority: 1,
  callbackUrl: '/checkout/callback',
  supportsRefund: true,
  supportsPartialRefund: true,
  supportsVerify: true,
  currency: 'IRT',
  minAmount: 100,
  maxAmount: 100000,
  timeoutSeconds: 30,
  healthStatus: 'healthy',
  createdAt: '',
  updatedAt: '',
}

describe('payment rules', () => {
  it('chooses priority provider', () => {
    expect(chooseProvider([p, { ...p, id: 'p2', priority: 2 }], 1000).id).toBe('p')
  })

  it('chooses by amount range', () => {
    const low = { ...p, id: 'low', priority: 1, minAmount: 1000, maxAmount: 5000 }
    const high = { ...p, id: 'high', priority: 2, minAmount: 5001, maxAmount: 10000 }
    expect(chooseProvider([low, high], 3000).id).toBe('low')
    expect(chooseProvider([low, high], 7000).id).toBe('high')
  })

  it('throws when no provider eligible', () => {
    expect(() => chooseProvider([p], 999999)).toThrow('NO_PAYMENT_PROVIDER')
  })

  it('rejects amount mismatch', () => {
    expect(() => assertPaymentAmount({ amount: 9, currency: 'IRT' }, 10, 'IRT')).toThrow(
      'PAYMENT_AMOUNT_MISMATCH'
    )
    expect(() => assertPaymentAmount({ amount: 10, currency: 'IRR' }, 10, 'IRT')).toThrow(
      'PAYMENT_AMOUNT_MISMATCH'
    )
  })

  it('limits refunds', () => {
    expect(() => assertRefundAmount({ amount: 60 }, 50, 100)).toThrow('REFUND_AMOUNT_INVALID')
    expect(() => assertRefundAmount({ amount: 40 }, 50, 100)).not.toThrow()
    expect(() => assertRefundAmount({ amount: 0 }, 0, 100)).toThrow('REFUND_AMOUNT_INVALID')
  })

  it('enforces transitions', () => {
    expect(canTransitionPayment('pending', 'succeeded')).toBe(true)
    expect(canTransitionPayment('failed', 'succeeded')).toBe(false)
    expect(canTransitionPayment('created', 'redirect_required')).toBe(true)
    expect(canTransitionPayment('succeeded', 'refunded')).toBe(true)
  })

  it('validates production secret ref', () => {
    expect(validateProvider({ ...p, environment: 'production' })).toContain(
      'کلید production باید از secret manager معرفی شود'
    )
    expect(validateProvider({ ...p, environment: 'sandbox' })).not.toContain(
      'کلید production باید از secret manager معرفی شود'
    )
  })

  it('validates callback and timeout', () => {
    expect(validateProvider({ ...p, callbackUrl: 'https://evil.com' })).toContain(
      'callback باید مسیر داخلی یا URL مجاز باشد'
    )
    expect(validateProvider({ ...p, timeoutSeconds: 2 })).toContain(
      'timeout باید بین ۵ تا ۱۲۰ ثانیه باشد'
    )
  })
})
