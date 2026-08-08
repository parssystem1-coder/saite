import type { PaymentGatewayAdapter } from '@/lib/payments/provider-contract'
import type { PaymentProvider } from '@/types/payment'

export const mockPaymentProvider: PaymentGatewayAdapter = {
  async createPayment(_provider: PaymentProvider, input) {
    console.log(`[MOCK PAYMENT] createPayment order=${input.orderId} amount=${input.amount}`)
    return {
      authority: `mock-${Date.now()}`,
      redirectUrl: `${input.callbackUrl}?authority=mock-${Date.now()}&status=OK`,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    }
  },

  async verifyPayment(_provider: PaymentProvider, authority: string, _amount: number) {
    console.log(`[MOCK PAYMENT] verifyPayment authority=${authority}`)
    return { success: true, transactionId: `mock-tx-${Date.now()}`, message: 'پرداخت موفق (mock)' }
  },

  async refundPayment(_provider: PaymentProvider, authority: string, _amount: number) {
    console.log(`[MOCK PAYMENT] refundPayment authority=${authority}`)
    return { success: true, providerRefundId: `mock-refund-${Date.now()}`, message: 'بازپرداخت موفق (mock)' }
  },

  async healthCheck() {
    return 'healthy'
  },
}
