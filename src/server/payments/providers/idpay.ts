import type { PaymentGatewayAdapter } from '@/lib/payments/provider-contract'
import type { PaymentProvider } from '@/types/payment'

const IDPAY_API = 'https://api.idpay.ir/v1.1'

export const idpayProvider: PaymentGatewayAdapter = {
  async createPayment(provider: PaymentProvider, input) {
    const res = await fetch(`${IDPAY_API}/payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': provider.apiKeySecretRef || '',
        'X-SANDBOX': provider.environment === 'sandbox' ? '1' : '0',
      },
      body: JSON.stringify({
        order_id: input.orderId,
        amount: input.amount,
        callback: input.callbackUrl,
        desc: `سفارش ${input.orderId}`,
      }),
    })

    const data = await res.json()
    if (!data.id) {
      throw new Error(`IDPay error: ${data.error_message || 'unknown'}`)
    }

    return {
      authority: data.id,
      redirectUrl: data.link,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    }
  },

  async verifyPayment(provider: PaymentProvider, authority: string, amount: number) {
    const res = await fetch(`${IDPAY_API}/payment/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': provider.apiKeySecretRef || '',
        'X-SANDBOX': provider.environment === 'sandbox' ? '1' : '0',
      },
      body: JSON.stringify({
        id: authority,
        order_id: authority,
        amount,
      }),
    })

    const data = await res.json()
    if (data.status === 100 || data.status === 101 || data.status === 200) {
      return {
        success: true,
        transactionId: data.track_id?.toString(),
        providerEventId: authority,
        message: 'پرداخت موفق',
      }
    }

    return {
      success: false,
      message: data.error_message || 'پرداخت ناموفق',
    }
  },

  async refundPayment(_provider: PaymentProvider, _authority: string, _amount: number) {
    return { success: false, message: 'بازپرداخت از طریق پنل IDPay انجام شود' }
  },

  async healthCheck() {
    try {
      const res = await fetch(`${IDPAY_API}/payment`, { method: 'POST' })
      return res.status === 400 ? 'healthy' : 'degraded'
    } catch {
      return 'down'
    }
  },
}
