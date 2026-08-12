import type { PaymentGatewayAdapter } from '@/lib/payments/provider-contract'
import type { PaymentProvider } from '@/types/payment'
import { fetchJson, HttpError } from '@/server/shared/fetch'
import { PAYMENT_INTENT_TTL_MS } from '@/server/shared/constants'

const ZARINPAL_API = 'https://api.zarinpal.com/pg/v4/payment'
const ZARINPAL_SANDBOX_API = 'https://sandbox.zarinpal.com/pg/v4/payment'

interface ZarinpalRequestResponse {
  data?: { code?: number; authority?: string }
  errors?: { message?: string }
}

interface ZarinpalVerifyResponse {
  data?: { code?: number; ref_id?: string | number }
  errors?: { message?: string }
}

export const zarinpalProvider: PaymentGatewayAdapter = {
  async createPayment(provider: PaymentProvider, input) {
    const baseUrl = provider.environment === 'sandbox' ? ZARINPAL_SANDBOX_API : ZARINPAL_API

    const data = await fetchJson<ZarinpalRequestResponse>(`${baseUrl}/request.json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        merchant_id: provider.merchantId,
        amount: input.amount,
        callback_url: input.callbackUrl,
        description: `سفارش ${input.orderId}`,
      }),
      retries: 2,
      initialDelayMs: 1000,
      maxDelayMs: 5000,
    })

    if (data.data?.code !== 100) {
      throw new Error(`Zarinpal error: ${data.errors?.message || 'unknown'}`)
    }

    const authority = data.data?.authority
    if (!authority) throw new Error('Zarinpal error: authority missing')
    const redirectBase = provider.environment === 'sandbox'
      ? 'https://sandbox.zarinpal.com/pg/StartPay/'
      : 'https://www.zarinpal.com/pg/StartPay/'

    return {
      authority,
      redirectUrl: `${redirectBase}${authority}`,
      expiresAt: new Date(Date.now() + PAYMENT_INTENT_TTL_MS).toISOString(),
    }
  },

  async verifyPayment(provider: PaymentProvider, authority: string, amount: number) {
    const baseUrl = provider.environment === 'sandbox' ? ZARINPAL_SANDBOX_API : ZARINPAL_API

    const data = await fetchJson<ZarinpalVerifyResponse>(`${baseUrl}/verify.json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        merchant_id: provider.merchantId,
        amount,
        authority,
      }),
      retries: 2,
      initialDelayMs: 1000,
      maxDelayMs: 5000,
    })

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
      // درخواست نامعتبر (بدون بدنه) → پاسخ 400 یعنی API زنده است
      await fetchJson(`${ZARINPAL_API}/request.json`, { method: 'POST' })
      return 'healthy' as const
    } catch (err) {
      if (err instanceof HttpError && err.status === 400) return 'healthy' as const
      return 'degraded' as const
    }
  },
}
