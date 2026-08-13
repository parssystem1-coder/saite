import { describe, expect, it } from 'vitest'
import {
  isGa4MeasurementId,
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
