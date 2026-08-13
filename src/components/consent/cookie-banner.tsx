'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  readAnalyticsConsentFromDocument,
  writeAnalyticsConsent,
  type AnalyticsConsent,
} from '@/lib/consent/analytics-consent'

export function CookieBanner() {
  const [consent, setConsent] = useState<AnalyticsConsent>('unset')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // کوکی فقط روی کلاینت خوانده می‌شود تا HTML سرور و هیدریشن یکی بمانند
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate-safe cookie read
    setConsent(readAnalyticsConsentFromDocument())
    setReady(true)
  }, [])

  if (!ready || consent !== 'unset') return null

  return (
    <div
      role="dialog"
      aria-labelledby="cookie-banner-title"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-surface-1/95 p-4 shadow-depth-4 backdrop-blur"
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p id="cookie-banner-title" className="text-sm font-bold">
            کوکی و آمار بازدید
          </p>
          <p className="mt-1 text-xs leading-6 text-muted-foreground">
            کوکی‌های ضروری برای سبد و ورود لازم‌اند. آمار بازدید (GA4 یا Tag Manager) فقط پس از رضایت
            شما بارگذاری می‌شود.{' '}
            <Link href="/privacy" className="text-primary underline-offset-2 hover:underline">
              سیاست حریم خصوصی
            </Link>
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              writeAnalyticsConsent('rejected')
              setConsent('rejected')
            }}
            className="rounded-xl border border-border px-3 py-2 text-xs"
          >
            فقط ضروری
          </button>
          <button
            type="button"
            onClick={() => {
              writeAnalyticsConsent('accepted')
              setConsent('accepted')
            }}
            className="rounded-xl bg-primary px-3 py-2 text-xs font-bold text-primary-foreground"
          >
            پذیرش آمار بازدید
          </button>
        </div>
      </div>
    </div>
  )
}
