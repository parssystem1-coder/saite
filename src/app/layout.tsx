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
  },
  twitter: { card: 'summary_large_image' },
  formatDetection: { email: false, address: false, telephone: false },
  icons: { icon: '/favicon.ico' },
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fa" dir="rtl" className={`${vazirmatn.variable} h-full`}>
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
