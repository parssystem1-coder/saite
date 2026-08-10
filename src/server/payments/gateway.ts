import { zarinpalProvider } from './providers/zarinpal'
import { idpayProvider } from './providers/idpay'
import { mockPaymentProvider } from './providers/mock'
import type { PaymentGatewayAdapter } from '@/lib/payments/provider-contract'
import { ServiceUnavailableError } from '@/server/shared/errors'

/**
 * انتخاب provider پرداخت باید fail-closed باشد.
 *
 * mock فقط برای توسعه و تست است. موفق نشان دادن پرداخت در production
 * وقتی credential واقعی جا افتاده، به سفارش/فاکتور جعلی منتهی می‌شود.
 */
export function resolvePaymentProvider(): PaymentGatewayAdapter {
  if (process.env.ZARINPAL_MERCHANT_ID) return zarinpalProvider
  if (process.env.IDPAY_API_KEY) return idpayProvider

  if (process.env.NODE_ENV !== 'production') return mockPaymentProvider

  throw new ServiceUnavailableError(
    'درگاه پرداخت پیکربندی نشده است',
    'PAYMENT_PROVIDER_NOT_CONFIGURED'
  )
}
