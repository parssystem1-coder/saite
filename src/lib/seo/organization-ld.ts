import { BRANDS } from '@/lib/constants'
import { SITE } from '@/lib/constants'
import { absoluteUrl, getSiteUrl } from '@/lib/seo/site-url'

/**
 * هویت سازمانی برای موتور جستجو.
 *
 * چرا برای این کسب‌وکار مهم است؟
 * خریدار سازمانی معمولاً پیش از تماس، نام فروشگاه را جستجو می‌کند.
 * بدون این schema، گوگل شمارهٔ تماس، ساعات کاری و نشانی را نمی‌شناسد
 * و پنل دانش (Knowledge Panel) نمی‌سازد.
 *
 * از `Store` استفاده می‌کنیم (زیرمجموعهٔ LocalBusiness) چون هم فروش
 * فیزیکی داریم و هم نشانی مشخص.
 */
export function buildOrganizationLd(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Store',
    '@id': `${getSiteUrl()}#organization`,
    name: SITE.fullName,
    alternateName: SITE.name,
    url: getSiteUrl(),
    telephone: SITE.phoneLtr,
    email: SITE.email,
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'IR',
      addressLocality: 'تهران',
      streetAddress: SITE.address,
    },
    openingHours: [
      // شنبه تا چهارشنبه ۹ تا ۱۸ — پنجشنبه ۹ تا ۱۳
      'Sa-We 09:00-18:00',
      'Th 09:00-13:00',
    ],
    sameAs: [`https://instagram.com/${SITE.instagram}`],
    // برندهایی که تأمین می‌کنیم — سیگنال مرتبط‌بودن برای جستجوی «تونر Canon»
    brand: BRANDS.map((b) => ({ '@type': 'Brand', name: b.displayName })),
  }
}

/**
 * WebSite + SearchAction.
 * به گوگل می‌گوید جستجوی داخلی سایت کجاست تا در نتایج، کادر
 * جستجوی مستقیم (Sitelinks Searchbox) نشان دهد.
 */
export function buildWebSiteLd(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${getSiteUrl()}#website`,
    url: getSiteUrl(),
    name: SITE.fullName,
    inLanguage: 'fa-IR',
    publisher: { '@id': `${getSiteUrl()}#organization` },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: absoluteUrl('/products?q={search_term_string}'),
      },
      'query-input': 'required name=search_term_string',
    },
  }
}
