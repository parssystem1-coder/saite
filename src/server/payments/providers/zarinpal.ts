import type { PaymentGatewayAdapter } from '@/lib/payments/provider-contract'
import type { PaymentProvider } from '@/types/payment'
import { retryAsync } from '@/lib/retry-utils'

const ZARINPAL_API = 'https://api.zarinpal.com/pg/v4/payment'
const ZARINPAL_SANDBOX_API = 'https://sandbox.zarinpal.com/pg/v4/payment'

export const zarinpalProvider: PaymentGatewayAdapter = {
  async createPayment(provider: PaymentProvider, input) {
    const baseUrl = provider.environment === 'sandbox' ? ZARINPAL_SANDBOX_API : ZARINPAL_API

    const data = await retryAsync(
      async () => {
        const res = await fetch(`${baseUrl}/request.json`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            merchant_id: provider.merchantId,
            amount: input.amount,
            callback_url: input.callbackUrl,
            description: `سفارش ${input.orderId}`,
          }),
        })

        if (!res.ok) {
          throw new Error(`Zarinpal API error: ${res.status} ${res.statusText}`)
        }

        return res.json()
      },
      { maxRetries: 2, initialDelayMs: 1000, maxDelayMs: 5000 }
    )

    if (data.data?.code !== 100) {
      throw new Error(`Zarinpal error: ${data.errors?.message || 'unknown'}`)
    }

    const authority = data.data.authority
    const redirectBase = provider.environment === 'sandbox'
      ? 'https://sandbox.zarinpal.com/pg/StartPay/'
      : 'https://www.zarinpal.com/pg/StartPay/'

    return {
      authority,
      redirectUrl: `${redirectBase}${authority}`,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    }
  },

  async verifyPayment(provider: PaymentProvider, authority: string, amount: number) {
    const baseUrl = provider.environment === 'sandbox' ? ZARINPAL_SANDBOX_API : ZARINPAL_API

    const data = await retryAsync(
      async () => {
        const res = await fetch(`${baseUrl}/verify.json`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            merchant_id: provider.merchantId,
            amount,
            authority,
          }),
        })

        if (!res.ok) {
          throw new Error(`Zarinpal API error: ${res.status} ${res.statusText}`)
        }

        return res.json()
      },
      { maxRetries: 2, initialDelayMs: 1000, maxDelayMs: 5000 }
    )

    if (data.data?.code === 100 || data.data?.code === 101) {
      return {
        success: true,
        transactionId: data.data.ref_id?.toString(),
        providerEventId: authority,
        message: 'پرداخت موفق',
      }
    }

    return {
      success: false,
      message: data.errors?.message || 'پرداخت ناموفق',
    }
  },

  async refundPayment(_provider: PaymentProvider, _authority: string, _amount: number) {
    // Zarinpal refund نیاز به API جدا دارد
    return { success: false, message: 'بازپرداخت از طریق پنل زرین‌پال انجام شود' }
  },

  async healthCheck() {
    try {
      const res = await fetch(`${ZARINPAL_API}/request.json`, { method: 'POST' })
      return res.status === 400 ? 'healthy' : 'degraded'
    } catch {
      return 'down'
    }
  },
}
