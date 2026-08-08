import { zarinpalProvider } from './providers/zarinpal'
import { idpayProvider } from './providers/idpay'
import { mockPaymentProvider } from './providers/mock'
import type { PaymentGatewayAdapter } from '@/lib/payments/provider-contract'

export function resolvePaymentProvider(): PaymentGatewayAdapter {
  if (process.env.ZARINPAL_MERCHANT_ID) return zarinpalProvider
  if (process.env.IDPAY_API_KEY) return idpayProvider
  return mockPaymentProvider
}
