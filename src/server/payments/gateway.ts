import { zarinpalProvider } from './providers/zarinpal'
import { idpayProvider } from './providers/idpay'
import { mockPaymentProvider } from './providers/mock'
import type { PaymentGatewayAdapter } from '@/lib/payments/provider-contract'
import type { PaymentProvider, PaymentProviderCode } from '@/types/payment'
import { ServiceUnavailableError } from '@/server/shared/errors'

/**
 * انتخاب provider پرداخت باید fail-closed باشد.
 *
 * mock فقط برای توسعه و تست است. موفق نشان دادن پرداخت در production
 * وقتی credential واقعی جا افتاده، به سفارش/فاکتور جعلی منتهی می‌شود.
 */

/** جفت adapter + provider — چون adapter ها به یک PaymentProvider نیاز دارند */
export interface ResolvedPayment {
  adapter: PaymentGatewayAdapter
  provider: PaymentProvider
}

interface ProviderRegistration {
  adapter: PaymentGatewayAdapter
  envKey: string
  name: string
}

/**
 * Registry درگاه‌های پرداخت — افزودن درگاه سوم (سامان/به‌پرداخت) فقط یک
 * سطر است؛ رفتار fail-closed به‌صورت خودکار از envKey حفظ می‌شود.
 */
const PROVIDERS: Partial<Record<PaymentProviderCode, ProviderRegistration>> = {
  zarinpal: { adapter: zarinpalProvider, envKey: 'ZARINPAL_MERCHANT_ID', name: 'زرین‌پال' },
  idpay: { adapter: idpayProvider, envKey: 'IDPAY_API_KEY', name: 'IDPay' },
}

const isSandbox = process.env.PAYMENT_SANDBOX === 'true'

/** ساخت PaymentProvider از متغیرهای محیطی — برای پاس به adapter ها */
export function buildProviderFromEnv(code: PaymentProviderCode): PaymentProvider {
  const now = new Date().toISOString()
  const environment = isSandbox ? 'sandbox' : 'production'
  const reg = PROVIDERS[code]
  const isZarinpal = code === 'zarinpal'
  return {
    id: code,
    name: reg?.name ?? code,
    code,
    environment,
    active: true,
    priority: 1,
    merchantId: isZarinpal ? process.env.ZARINPAL_MERCHANT_ID : undefined,
    apiKeySecretRef: isZarinpal ? undefined : process.env.IDPAY_API_KEY,
    callbackUrl: '',
    supportsRefund: false,
    supportsPartialRefund: false,
    supportsVerify: true,
    currency: 'IRR',
    minAmount: 1000,
    timeoutSeconds: 30,
    healthStatus: 'unknown',
    createdAt: now,
    updatedAt: now,
  }
}

/**
 * انتخاب provider برای شروع پرداخت — fail-closed در production.
 * اولویت: زرین‌پال → IDPay → mock (فقط غیر-production).
 */
export function resolvePaymentProviderForCreate(): ResolvedPayment {
  // ترتیب اولویت: زرین‌پال → IDPay → mock (فقط غیر-production)
  const ordered: PaymentProviderCode[] = ['zarinpal', 'idpay']
  for (const code of ordered) {
    const reg = PROVIDERS[code]
    if (reg && process.env[reg.envKey]) {
      return { adapter: reg.adapter, provider: buildProviderFromEnv(code) }
    }
  }
  if (process.env.NODE_ENV !== 'production') {
    return { adapter: mockPaymentProvider, provider: buildProviderFromEnv('zarinpal') }
  }
  throw new ServiceUnavailableError(
    'درگاه پرداخت پیکربندی نشده است',
    'PAYMENT_PROVIDER_NOT_CONFIGURED'
  )
}

/**
 * انتخاب provider بر اساس کد مشخص — برای webhook ها که مسیرشان به یک
 * درگاه خاص وابسته است. fail-closed: بدون credential، خطا می‌دهد.
 */
export function resolvePaymentProviderByCode(code: string): ResolvedPayment {
  const reg = PROVIDERS[code as PaymentProviderCode]
  if (!reg) {
    throw new ServiceUnavailableError(
      `درگاه پرداخت «${code}» شناخته‌شده نیست`,
      'PAYMENT_PROVIDER_NOT_CONFIGURED'
    )
  }
  if (!process.env[reg.envKey]) {
    throw new ServiceUnavailableError(
      `${reg.name} پیکربندی نشده است`,
      'PAYMENT_PROVIDER_NOT_CONFIGURED'
    )
  }
  return { adapter: reg.adapter, provider: buildProviderFromEnv(code as PaymentProviderCode) }
}

// backward-compat — قبلاً فقط adapter برمی‌گشت
export function resolvePaymentProvider(): PaymentGatewayAdapter {
  return resolvePaymentProviderForCreate().adapter
}
