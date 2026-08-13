import 'server-only'
import { isGa4MeasurementId, isGtmContainerId } from '@/lib/consent/analytics-consent'

/**
 * وضعیت اتصالات رایگان گوگل — فقط boolean.
 * مقدار env هرگز به کلاینت یا لاگ برنمی‌گردد.
 */
export type GoogleConnectionStatus = {
  searchConsoleConfigured: boolean
  ga4Configured: boolean
  gtmConfigured: boolean
}

export type PublicAnalyticsInjection = {
  /** کانتینر رسمی GTM؛ خالی یعنی GTM تزریق نمی‌شود */
  gtmContainerId: string
  /** GA4 مستقیم؛ اگر GTM فعال باشد خالی است تا شمارش دوباره نشود */
  ga4MeasurementId: string
}

export function getGoogleConnectionStatus(): GoogleConnectionStatus {
  return {
    searchConsoleConfigured: Boolean(process.env.GOOGLE_SITE_VERIFICATION?.trim()),
    ga4Configured: isGa4MeasurementId(process.env.GA4_MEASUREMENT_ID),
    gtmConfigured: isGtmContainerId(process.env.GTM_CONTAINER_ID),
  }
}

export function getGa4MeasurementIdForInjection(): string {
  const value = process.env.GA4_MEASUREMENT_ID?.trim() ?? ''
  return isGa4MeasurementId(value) ? value : ''
}

export function getGtmContainerIdForInjection(): string {
  const value = process.env.GTM_CONTAINER_ID?.trim() ?? ''
  return isGtmContainerId(value) ? value.toUpperCase() : ''
}

/**
 * تصمیم تزریق فروشگاه: GTM رسمی اولویت دارد.
 * هر دو با هم تزریق نمی‌شوند.
 */
export function getPublicAnalyticsInjection(): PublicAnalyticsInjection {
  const gtmContainerId = getGtmContainerIdForInjection()
  if (gtmContainerId) {
    return { gtmContainerId, ga4MeasurementId: '' }
  }
  return {
    gtmContainerId: '',
    ga4MeasurementId: getGa4MeasurementIdForInjection(),
  }
}

export function getGoogleSiteVerificationToken(): string | undefined {
  const value = process.env.GOOGLE_SITE_VERIFICATION?.trim()
  return value ? value : undefined
}
