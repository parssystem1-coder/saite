import type { Metadata } from 'next'
import { StorefrontChrome } from '@/components/layout/storefront-chrome'
import Providers from '@/components/providers'
import { JsonLd } from '@/components/seo/json-ld'
import { buildOrganizationLd, buildWebSiteLd } from '@/lib/seo/organization-ld'
import { SITE } from '@/lib/constants'
import { vazirmatn } from '@/lib/fonts'
import './globals.css'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${SITE.fullName} | پرینتر، اسکنر، کپی و قطعات یدکی`,
    template: `%s | ${SITE.name}`,
  },
  description:
    'تأمین، فروش و سرویس ماشین‌های اداری؛ پرینتر، اسکنر، دستگاه کپی، فکس، مواد مصرفی و قطعات یدکی با ضمانت اصالت کالا و مشاورهٔ تخصصی.',
  keywords: [
    'پرینتر',
    'اسکنر',
    'دستگاه کپی',
    'فکس',
    'تونر',
    'کارتریج',
    'قطعات یدکی ماشین اداری',
    'تعمیر پرینتر',
  ],
  authors: [{ name: SITE.fullName }],
  openGraph: {
    type: 'website',
    locale: 'fa_IR',
    siteName: SITE.fullName,
    title: `${SITE.fullName} | تجهیزات و ماشین‌های اداری`,
    description: 'فروش و سرویس تخصصی پرینتر، اسکنر، دستگاه کپی و قطعات یدکی.',
    /*
      🆕 فاز E — لینک به opengraph-image route. Next.js خودش این
      را از src/app/opengraph-image.tsx می‌خواند و metadata را
      همراه HTML می‌فرستد. ارجاع صریح یعنی صفحاتی که خودشان
      metadata جداگانه دارند هم می‌توانند به این تصویر برگردند.
    */
    url: siteUrl,
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE.fullName,
    description: 'فروش و سرویس تخصصی پرینتر، اسکنر، دستگاه کپی و قطعات یدکی.',
  },
  formatDetection: { email: false, address: false, telephone: false },
  icons: { icon: '/favicon.ico' },
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="fa"
      dir="rtl"
      className={`${vazirmatn.variable} h-full`}
      /*
        🆕 اسکرول نرم فقط برای تعامل کاربر (کلیک روی anchor)،
        نه برای ناوبری route.

        Next.js اگر `scroll-behavior: smooth` روی <html> باشد،
        هنگام تغییر route اسکرول به‌بالای صفحه هم آرام می‌شود که
        احساس تأخیر می‌دهد. با این data attribute، Next خودش
        هنگام route transition آن را موقتاً به `auto` عوض می‌کند
        و بعد از رندر برمی‌گرداند.

        منبع: https://nextjs.org/docs/messages/missing-data-scroll-behavior
      */
      data-scroll-behavior="smooth"
    >
      <head>
        {/*
          🆕 فاز E — preconnect به میزبان تصاویر خارجی.
          Unsplash هنوز در بسیاری از mockها استفاده نمی‌شود ولی
          `next.config.remotePatterns` آن را مجاز کرده. با
          preconnect، اولین تصویری که سایت روی این دامنه بخواهد،
          یک RTT کمتر می‌گیرد (DNS + TCP + TLS از قبل انجام شده).
          هزینه: چند بایت HTML و یک اتصال idle که بعد از ۱۰
          ثانیه بسته می‌شود.
        */}
        <link rel="preconnect" href="https://images.unsplash.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
      </head>
      <body className="flex min-h-full flex-col font-sans">
        {/* هویت سازمانی و سایت — یک‌بار در سطح ریشه، نه در هر صفحه */}
        <JsonLd data={[buildOrganizationLd(), buildWebSiteLd()]} />
        <Providers>
          {/* هدر/فوتر فروشگاه در ناحیهٔ /admin رندر نمی‌شوند */}
          <StorefrontChrome>{children}</StorefrontChrome>
        </Providers>
      </body>
    </html>
  )
}
