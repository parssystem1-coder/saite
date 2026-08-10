import { describe, expect, it, vi } from 'vitest'

describe('production provider configuration', () => {
  it('refuses to use the mock payment provider in production', async () => {
    vi.resetModules()
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('ZARINPAL_MERCHANT_ID', '')
    vi.stubEnv('IDPAY_API_KEY', '')

    const { resolvePaymentProvider } = await import('@/server/payments/gateway')
    expect(() => resolvePaymentProvider()).toThrow(/پیکربندی نشده/)

    vi.unstubAllEnvs()
  })

  it('allows the mock payment provider outside production', async () => {
    vi.resetModules()
    vi.stubEnv('NODE_ENV', 'test')
    vi.stubEnv('ZARINPAL_MERCHANT_ID', '')
    vi.stubEnv('IDPAY_API_KEY', '')

    const { resolvePaymentProvider } = await import('@/server/payments/gateway')
    await expect(resolvePaymentProvider().healthCheck({} as never)).resolves.toBe('healthy')

    vi.unstubAllEnvs()
  })
})
