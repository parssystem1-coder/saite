import { afterEach, describe, expect, it } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import { GtmScript } from '@/components/analytics/gtm-script'
import { ANALYTICS_CONSENT_COOKIE } from '@/lib/consent/analytics-consent'

type DataLayerWindow = Window & { dataLayer?: Array<Record<string, unknown>> }

function clearConsentCookie(): void {
  document.cookie = `${ANALYTICS_CONSENT_COOKIE}=; Max-Age=0; Path=/`
}

describe('GtmScript', () => {
  afterEach(() => {
    clearConsentCookie()
    delete (window as DataLayerWindow).dataLayer
  })

  it('بدون رضایت dataLayer را راه نمی‌اندازد', () => {
    clearConsentCookie()
    render(<GtmScript containerId="GTM-ABCDEF" />)
    expect((window as DataLayerWindow).dataLayer).toBeUndefined()
  })

  it('پس از رضایت رویداد رسمی gtm.js را در dataLayer می‌گذارد', async () => {
    document.cookie = `${ANALYTICS_CONSENT_COOKIE}=accepted; Path=/`
    render(<GtmScript containerId="GTM-ABCDEF" />)
    await waitFor(() => {
      const layer = (window as DataLayerWindow).dataLayer
      expect(layer?.some((entry) => entry.event === 'gtm.js')).toBe(true)
    })
  })

  it('شناسهٔ نامعتبر را نادیده می‌گیرد حتی با رضایت', async () => {
    document.cookie = `${ANALYTICS_CONSENT_COOKIE}=accepted; Path=/`
    render(<GtmScript containerId="<script>alert(1)</script>" />)
    await new Promise((resolve) => {
      setTimeout(resolve, 20)
    })
    expect((window as DataLayerWindow).dataLayer).toBeUndefined()
  })
})
