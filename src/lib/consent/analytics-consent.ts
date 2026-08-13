/**
 * رضایت کوکی برای تحلیل (GA4).
 *
 * کوکی HttpOnly نیست چون بنر و اسکریپت تحلیل در کلاینت باید آن را بخوانند.
 * مقدار فقط accepted | rejected است — هرگز شناسهٔ اندازه‌گیری یا کلید API نیست.
 */

export const ANALYTICS_CONSENT_COOKIE = 'saite_analytics_consent'
export const ANALYTICS_CONSENT_MAX_AGE_SECONDS = 60 * 60 * 24 * 180
export const ANALYTICS_CONSENT_EVENT = 'saite-consent-change'

export type AnalyticsConsent = 'accepted' | 'rejected' | 'unset'

export function parseAnalyticsConsent(raw: string | undefined | null): AnalyticsConsent {
  const value = raw?.trim()
  if (value === 'accepted' || value === 'rejected') return value
  return 'unset'
}

export function isGa4MeasurementId(value: string | undefined | null): boolean {
  if (!value) return false
  return /^G-[A-Z0-9]{6,14}$/i.test(value.trim())
}

export function readAnalyticsConsentFromDocument(): AnalyticsConsent {
  if (typeof document === 'undefined') return 'unset'
  const parts = document.cookie.split(';')
  for (const part of parts) {
    const [name, ...rest] = part.trim().split('=')
    if (name === ANALYTICS_CONSENT_COOKIE) {
      return parseAnalyticsConsent(decodeURIComponent(rest.join('=')))
    }
  }
  return 'unset'
}

export function writeAnalyticsConsent(value: 'accepted' | 'rejected'): void {
  if (typeof document === 'undefined') return
  const secure = typeof window !== 'undefined' && window.location.protocol === 'https:' ? '; Secure' : ''
  document.cookie = `${ANALYTICS_CONSENT_COOKIE}=${value}; Path=/; Max-Age=${ANALYTICS_CONSENT_MAX_AGE_SECONDS}; SameSite=Lax${secure}`
  window.dispatchEvent(new Event(ANALYTICS_CONSENT_EVENT))
}

/** میزبان‌های رسمی GA4 برای CSP صفحات عمومی — نه پنل ادمین. */
export const GA4_SCRIPT_ORIGINS = ['https://www.googletagmanager.com'] as const
export const GA4_CONNECT_ORIGINS = [
  'https://www.google-analytics.com',
  'https://www.googletagmanager.com',
  'https://*.google-analytics.com',
  'https://*.analytics.google.com',
  'https://*.googletagmanager.com',
] as const
export const GA4_IMG_ORIGINS = [
  'https://www.google-analytics.com',
  'https://www.googletagmanager.com',
] as const
