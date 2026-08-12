import type { PaymentGatewayAdapter } from '@/lib/payments/provider-contract'
import type { PaymentProvider } from '@/types/payment'
import { fetchJson, HttpError } from '@/server/shared/fetch'
import { PAYMENT_INTENT_TTL_MS } from '@/server/shared/constants'
import { IDPAY } from '@/server/payments/status-codes'

const IDPAY_API = 'https://api.idpay.ir/v1.1'

interface IdpayRequestResponse {
  id?: string
  link?: string
  error_message?: string
}

interface IdpayVerifyResponse {
  status?: number
  track_id?: string | number
  error_message?: string
}

export const idpayProvider: PaymentGatewayAdapter = {
  async createPayment(provider: PaymentProvider, input) {
    const data = await fetchJson<IdpayRequestResponse>(`${IDPAY_API}/payment`, {
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
      retries: 2,
      initialDelayMs: 1000,
      maxDelayMs: 5000,
    })

    if (!data.id) {
      throw new Error(`IDPay error: ${data.error_message || 'unknown'}`)
    }

    return {
      authority: data.id,
      redirectUrl: data.link || '',
      expiresAt: new Date(Date.now() + PAYMENT_INTENT_TTL_MS).toISOString(),
    }
  },

  async verifyPayment(provider: PaymentProvider, authority: string, amount: number) {
    const data = await fetchJson<IdpayVerifyResponse>(`${IDPAY_API}/payment/verify`, {
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
      retries: 2,
      initialDelayMs: 1000,
      maxDelayMs: 5000,
    })

    if (
      data.status === IDPAY.PAYMENT_SUCCESS_1 ||
      data.status === IDPAY.PAYMENT_SUCCESS_2 ||
      data.status === IDPAY.PAYMENT_SUCCESS_3
    ) {
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
      await fetchJson(`${IDPAY_API}/payment`, { method: 'POST' })
      return 'healthy' as const
    } catch (err) {
      if (err instanceof HttpError && err.status === 400) return 'healthy' as const
      return 'degraded' as const
    }
  },
}
