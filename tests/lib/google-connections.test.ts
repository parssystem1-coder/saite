import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  getGa4MeasurementIdForInjection,
  getGoogleConnectionStatus,
  getGtmContainerIdForInjection,
  getPublicAnalyticsInjection,
} from '@/lib/seo/google-connections'

describe('google connection status', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('وضعیت را بدون برگرداندن شناسه یا کلید می‌دهد', () => {
    vi.stubEnv('GOOGLE_SITE_VERIFICATION', 'secret-token')
    vi.stubEnv('GA4_MEASUREMENT_ID', 'G-ABC123DEF4')
    vi.stubEnv('GTM_CONTAINER_ID', 'GTM-ABCDEF')
    const status = getGoogleConnectionStatus()
    expect(status).toEqual({
      searchConsoleConfigured: true,
      ga4Configured: true,
      gtmConfigured: true,
    })
    expect(JSON.stringify(status)).not.toContain('secret-token')
    expect(JSON.stringify(status)).not.toContain('G-ABC123DEF4')
    expect(JSON.stringify(status)).not.toContain('GTM-ABCDEF')
  })

  it('شناسهٔ نامعتبر را پیکربندی‌شده حساب نمی‌کند', () => {
    vi.stubEnv('GTM_CONTAINER_ID', 'not-gtm')
    vi.stubEnv('GA4_MEASUREMENT_ID', 'UA-1')
    expect(getGoogleConnectionStatus().gtmConfigured).toBe(false)
    expect(getGoogleConnectionStatus().ga4Configured).toBe(false)
    expect(getGtmContainerIdForInjection()).toBe('')
    expect(getGa4MeasurementIdForInjection()).toBe('')
  })
})

describe('getPublicAnalyticsInjection', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('اگر GTM معتبر باشد GA4 مستقیم تزریق نمی‌شود', () => {
    vi.stubEnv('GTM_CONTAINER_ID', 'gtm-nw4r2x')
    vi.stubEnv('GA4_MEASUREMENT_ID', 'G-ABC123DEF4')
    expect(getPublicAnalyticsInjection()).toEqual({
      gtmContainerId: 'GTM-NW4R2X',
      ga4MeasurementId: '',
    })
  })

  it('بدون GTM همان GA4 معتبر را تزریق می‌کند', () => {
    vi.stubEnv('GTM_CONTAINER_ID', '')
    vi.stubEnv('GA4_MEASUREMENT_ID', 'G-ABC123DEF4')
    expect(getPublicAnalyticsInjection()).toEqual({
      gtmContainerId: '',
      ga4MeasurementId: 'G-ABC123DEF4',
    })
  })
})
