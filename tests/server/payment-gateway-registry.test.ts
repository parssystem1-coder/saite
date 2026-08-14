import { describe, it, expect, vi, afterEach } from 'vitest'

/**
 * فاز ۵ — Registry درگاه‌های پرداخت (جایگزین if/else).
 */
describe('payment gateway registry (فاز ۵)', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it('resolvePaymentProviderByCode با کد شناخته‌شده و credential → provider صحیح', async () => {
    vi.stubEnv('NODE_ENV', 'test')
    vi.stubEnv('ZARINPAL_MERCHANT_ID', 'zp-123')
    const { resolvePaymentProviderByCode } = await import('@/server/payments/gateway')
    const resolved = resolvePaymentProviderByCode('zarinpal')
    expect(resolved.provider.code).toBe('zarinpal')
    expect(resolved.provider.name).toBe('زرین‌پال')
  })

  it('resolvePaymentProviderByCode بدون credential → fail-closed', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('IDPAY_API_KEY', '')
    const { resolvePaymentProviderByCode } = await import('@/server/payments/gateway')
    expect(() => resolvePaymentProviderByCode('idpay')).toThrow(/پیکربندی نشده/)
  })

  it('resolvePaymentProviderByCode با کد نامعتبر → خطا', async () => {
    vi.stubEnv('NODE_ENV', 'test')
    const { resolvePaymentProviderByCode } = await import('@/server/payments/gateway')
    expect(() => resolvePaymentProviderByCode('bogus')).toThrow(/شناخته‌شده نیست/)
  })

  it('resolvePaymentProviderForCreate: اولویت زینرپال → IDPay → mock', async () => {
    vi.stubEnv('NODE_ENV', 'test')
    vi.stubEnv('ZARINPAL_MERCHANT_ID', '')
    vi.stubEnv('IDPAY_API_KEY', 'idpay-key')
    const { resolvePaymentProviderForCreate } = await import('@/server/payments/gateway')
    const resolved = resolvePaymentProviderForCreate()
    expect(resolved.provider.code).toBe('idpay')
  })
})
