import { describe, expect, it } from 'vitest'
import {
  bootstrapGtmDataLayer,
  buildOfficialGtmJsUrl,
  isGa4MeasurementId,
  isGtmContainerId,
  parseAnalyticsConsent,
} from '@/lib/consent/analytics-consent'

describe('parseAnalyticsConsent', () => {
  it('accepted و rejected را می‌شناسد', () => {
    expect(parseAnalyticsConsent('accepted')).toBe('accepted')
    expect(parseAnalyticsConsent('rejected')).toBe('rejected')
  })

  it('مقدار ناشناخته را unset می‌کند', () => {
    expect(parseAnalyticsConsent(undefined)).toBe('unset')
    expect(parseAnalyticsConsent('yes')).toBe('unset')
  })
})

describe('isGa4MeasurementId', () => {
  it('شناسهٔ رسمی G- را می‌پذیرد', () => {
    expect(isGa4MeasurementId('G-ABC123DEF4')).toBe(true)
  })

  it('مقدار خالی یا جعلی را رد می‌کند', () => {
    expect(isGa4MeasurementId('')).toBe(false)
    expect(isGa4MeasurementId('UA-123')).toBe(false)
    expect(isGa4MeasurementId('G-')).toBe(false)
  })
})

describe('isGtmContainerId', () => {
  it('شناسهٔ رسمی GTM- را می‌پذیرد', () => {
    expect(isGtmContainerId('GTM-ABCDEF')).toBe(true)
    expect(isGtmContainerId('gtm-nw4r2x')).toBe(true)
  })

  it('HTML سفارشی یا مقدار جعلی را رد می‌کند', () => {
    expect(isGtmContainerId('')).toBe(false)
    expect(isGtmContainerId('GTM-')).toBe(false)
    expect(isGtmContainerId('G-ABC123DEF4')).toBe(false)
    expect(isGtmContainerId('<script>alert(1)</script>')).toBe(false)
    expect(isGtmContainerId('https://evil.example/gtm.js')).toBe(false)
  })
})

describe('buildOfficialGtmJsUrl', () => {
  it('فقط میزبان رسمی gtm.js را می‌سازد', () => {
    expect(buildOfficialGtmJsUrl('gtm-abcdef')).toBe(
      'https://www.googletagmanager.com/gtm.js?id=GTM-ABCDEF'
    )
  })

  it('شناسهٔ نامعتبر را null می‌کند', () => {
    expect(buildOfficialGtmJsUrl('not-a-container')).toBeNull()
  })
})

describe('bootstrapGtmDataLayer', () => {
  it('رویداد رسمی gtm.js را فقط یک‌بار می‌گذارد', () => {
    const host = { dataLayer: [] as Array<Record<string, unknown>> }
    bootstrapGtmDataLayer(host)
    bootstrapGtmDataLayer(host)
    expect(host.dataLayer).toHaveLength(1)
    expect(host.dataLayer[0]?.event).toBe('gtm.js')
    expect(typeof host.dataLayer[0]?.['gtm.start']).toBe('number')
  })
})
