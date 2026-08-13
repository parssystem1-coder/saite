'use client'

import { useEffect, useState } from 'react'
import Script from 'next/script'
import {
  ANALYTICS_CONSENT_EVENT,
  bootstrapGtmDataLayer,
  buildOfficialGtmJsUrl,
  readAnalyticsConsentFromDocument,
  type GtmDataLayerHost,
} from '@/lib/consent/analytics-consent'

/**
 * اسنیپت رسمی Google Tag Manager.
 *
 * فقط `https://www.googletagmanager.com/gtm.js?id=GTM-…` پس از رضایت کوکی.
 * بدون IIFE اینلاین، بدون HTML تفسیرشده، بدون iframe noscript
 * (CSP عمومی `frame-src 'none'` است). پنل ادمین این کامپوننت را رندر نمی‌کند.
 */
export function GtmScript({ containerId }: { containerId: string }) {
  const src = buildOfficialGtmJsUrl(containerId)
  const [allowed, setAllowed] = useState(false)

  useEffect(() => {
    const sync = () => {
      const ok = Boolean(src) && readAnalyticsConsentFromDocument() === 'accepted'
      if (ok) bootstrapGtmDataLayer(window as unknown as GtmDataLayerHost)
      setAllowed(ok)
    }
    sync()
    window.addEventListener(ANALYTICS_CONSENT_EVENT, sync)
    return () => window.removeEventListener(ANALYTICS_CONSENT_EVENT, sync)
  }, [src])

  if (!allowed || !src) return null

  return (
    <Script
      src={src}
      strategy="afterInteractive"
      onLoad={() => {
        if (typeof window === 'undefined') return
        bootstrapGtmDataLayer(window as unknown as GtmDataLayerHost)
      }}
    />
  )
}
