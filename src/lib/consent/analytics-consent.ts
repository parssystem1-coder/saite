/**
 * رضایت کوکی برای تحلیل (GA4 / GTM).
 *
 * کوکی HttpOnly نیست چون بنر و اسکریپت تحلیل در کلاینت باید آن را بخوانند.
 * مقدار فقط accepted | rejected است — هرگز شناسهٔ اندازه‌گیری، کانتینر یا کلید API نیست.
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

/** شناسهٔ رسمی کانتینر GTM — فقط GTM- و حروف/رقم، نه HTML سفارشی. */
export function isGtmContainerId(value: string | undefined | null): boolean {
  if (!value) return false
  return /^GTM-[A-Z0-9]{4,12}$/i.test(value.trim())
}

export const OFFICIAL_GTM_JS_ORIGIN = 'https://www.googletagmanager.com'

export function buildOfficialGtmJsUrl(containerId: string | undefined | null): string | null {
  const raw = containerId?.trim() ?? ''
  if (!isGtmContainerId(raw)) return null
  const id = raw.toUpperCase()
  return `${OFFICIAL_GTM_JS_ORIGIN}/gtm.js?id=${encodeURIComponent(id)}`
}

export type GtmDataLayerEntry = Record<string, unknown>

export type GtmDataLayerHost = {
  dataLayer?: GtmDataLayerEntry[]
}

/**
 * معادل بخش dataLayer اسنیپت رسمی GTM، بدون IIFE اینلاین.
 * رویداد gtm.start فقط یک‌بار push می‌شود.
 */
export function bootstrapGtmDataLayer(host: GtmDataLayerHost): GtmDataLayerEntry[] {
  host.dataLayer = host.dataLayer ?? []
  const started = host.dataLayer.some(
    (entry) => entry.event === 'gtm.js' && typeof entry['gtm.start'] === 'number'
  )
  if (!started) {
    host.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' })
  }
  return host.dataLayer
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

/** میزبان‌های رسمی GA4/GTM برای CSP صفحات عمومی — نه پنل ادمین. iframe GTM مجاز نیست. */
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
