'use client'

import { useEffect, useState } from 'react'
import Script from 'next/script'
import {
  ANALYTICS_CONSENT_EVENT,
  isGa4MeasurementId,
  readAnalyticsConsentFromDocument,
} from '@/lib/consent/analytics-consent'

type DataLayerWindow = Window & { dataLayer?: unknown[] }

function pushGtag(measurementId: string): void {
  const win = window as DataLayerWindow
  win.dataLayer = win.dataLayer ?? []
  const gtag = (...args: unknown[]) => {
    win.dataLayer?.push(args)
  }
  gtag('js', new Date())
  gtag('config', measurementId, { anonymize_ip: true })
}

/**
 * نقطهٔ تزریق رسمی GA4.
 *
 * - فقط اگر شناسه معتبر باشد
 * - فقط پس از رضایت analytics
 * - بدون اسکریپت inline: پیکربندی در onLoad باندل خودمان اجرا می‌شود
 * - اگر GTM فعال باشد این کامپوننت اصلاً رندر نمی‌شود (اولویت با gtm.js)
 */
export function Ga4Script({ measurementId }: { measurementId: string }) {
  const [allowed, setAllowed] = useState(false)
  const validId = isGa4MeasurementId(measurementId) ? measurementId.trim() : ''

  useEffect(() => {
    const sync = () => {
      setAllowed(Boolean(validId) && readAnalyticsConsentFromDocument() === 'accepted')
    }
    sync()
    window.addEventListener(ANALYTICS_CONSENT_EVENT, sync)
    return () => window.removeEventListener(ANALYTICS_CONSENT_EVENT, sync)
  }, [validId])

  if (!validId || !allowed) return null

  return (
    <Script
      src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(validId)}`}
      strategy="afterInteractive"
      onLoad={() => {
        pushGtag(validId)
      }}
    />
  )
}
