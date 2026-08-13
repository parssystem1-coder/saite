import 'server-only'
import { isGa4MeasurementId } from '@/lib/consent/analytics-consent'

/**
 * وضعیت اتصالات رایگان گوگل — فقط boolean.
 * مقدار env هرگز به کلاینت یا لاگ برنمی‌گردد.
 */
export type GoogleConnectionStatus = {
  searchConsoleConfigured: boolean
  ga4Configured: boolean
}

export function getGoogleConnectionStatus(): GoogleConnectionStatus {
  return {
    searchConsoleConfigured: Boolean(process.env.GOOGLE_SITE_VERIFICATION?.trim()),
    ga4Configured: isGa4MeasurementId(process.env.GA4_MEASUREMENT_ID),
  }
}

export function getGa4MeasurementIdForInjection(): string {
  const value = process.env.GA4_MEASUREMENT_ID?.trim() ?? ''
  return isGa4MeasurementId(value) ? value : ''
}

export function getGoogleSiteVerificationToken(): string | undefined {
  const value = process.env.GOOGLE_SITE_VERIFICATION?.trim()
  return value ? value : undefined
}
