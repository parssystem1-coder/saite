'use client'

import { usePathname } from 'next/navigation'
import { CompareBar } from '@/components/compare/compare-bar'
import { ChatWidget } from '@/components/chat/chat-widget'
import { ContactFab } from '@/components/layout/contact-fab'
import { Footer } from '@/components/layout/footer'
import { Header } from '@/components/layout/header'
import { MobileBottomNav } from '@/components/layout/mobile-bottom-nav'
import { SkipLink } from '@/components/layout/skip-link'
import { CookieBanner } from '@/components/consent/cookie-banner'
import { Ga4Script } from '@/components/analytics/ga4-script'
import { isFloatingChromeHidden } from '@/lib/layout/floating-chrome'
import { cn } from '@/lib/utils'

/**
 * پوستهٔ فروشگاه — هدر، فوتر و المان‌های شناور.
 *
 * ── چرا مسیرآگاه است؟ ─────────────────────────────────────────
 * پیش از این Header و Footer مستقیماً در layout ریشه بودند، پس
 * صفحهٔ «ورود مدیر» هم هدر فروشگاه را نشان می‌داد — با دکمهٔ
 * «ورود / ثبت‌نام» و آیکون سبد خرید. این دقیقاً همان اختلاطی است
 * که باید از بین می‌رفت: صفحه‌ای که می‌گوید «ناحیهٔ محدود» نباید
 * کنارش دعوت به ثبت‌نام مشتری باشد.
 *
 * ناحیهٔ `/admin` پوستهٔ خودش را دارد (`AdminShell`) و به هدر و
 * فوتر فروشگاه نیازی ندارد.
 *
 * پوشش `main` هم اینجاست تا در ناحیهٔ مدیریت، `flex-1` اضافی
 * چیدمان را به هم نزند.
 */
export function StorefrontChrome({
  children,
  ga4MeasurementId = '',
}: {
  children: React.ReactNode
  ga4MeasurementId?: string
}) {
  const pathname = usePathname()
  const isAdminArea = isFloatingChromeHidden(pathname)

  if (isAdminArea) {
    return (
      <main id="main-content" tabIndex={-1} className="flex-1 outline-none">
        {children}
      </main>
    )
  }

  return (
    <>
      <SkipLink />
      <Header />
      {/* tabIndex={-1} تا پس از پرش، فوکوس واقعاً روی main بنشیند */}
      <main
        id="main-content"
        tabIndex={-1}
        className={cn('flex-1 outline-none pb-16 lg:pb-0')}
      >
        {children}
      </main>
      <Footer />
      <CompareBar />
      <ContactFab />
      <ChatWidget />
      <MobileBottomNav />
      <CookieBanner />
      <Ga4Script measurementId={ga4MeasurementId} />
    </>
  )
}
