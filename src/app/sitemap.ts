import type { MetadataRoute } from 'next'
import { httpJson, isMockMode } from '@/lib/api-client'
import { getProducts } from '@/lib/api'
import { ARTICLES } from '@/lib/articles'
import { BRANDS, CATEGORIES } from '@/lib/constants'
import { SERVICE_DETAILS } from '@/lib/services-data'
import type { ProductListResult } from '@/lib/api-types'
import { SITEMAP_MAX_PER_PAGE } from '@/server/shared/constants'

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

/** صفحات ثابت قابل ایندکس — صفحات شخصی (سبد، علاقه‌مندی) عمداً حذف شده‌اند */
const STATIC_PAGES: { path: string; priority: number; freq: 'daily' | 'weekly' | 'monthly' }[] = [
  { path: '/products', priority: 0.9, freq: 'daily' },
  { path: '/brands', priority: 0.8, freq: 'weekly' },
  { path: '/services', priority: 0.8, freq: 'monthly' },
  { path: '/blog', priority: 0.8, freq: 'weekly' },
  { path: '/contact', priority: 0.7, freq: 'monthly' },
  { path: '/about', priority: 0.6, freq: 'monthly' },
  { path: '/faq', priority: 0.6, freq: 'monthly' },
  { path: '/shipping', priority: 0.4, freq: 'monthly' },
  { path: '/warranty', priority: 0.4, freq: 'monthly' },
  { path: '/terms', priority: 0.3, freq: 'monthly' },
  { path: '/privacy', priority: 0.3, freq: 'monthly' },
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // فهرست سبک — فقط slug/updatedAt (description/specs کشیده نمی‌شود)
  let products: { slug: string; updatedAt?: Date }[]
  if (isMockMode()) {
    products = (await getProducts()).map((p) => ({ slug: p.slug }))
  } else {
    // در حالت HTTP فقط slug/updatedAt کشیده می‌شود — نه description/specs
    const result = await httpJson<ProductListResult>(
      `/api/products?fields=slug&page=1&perPage=${SITEMAP_MAX_PER_PAGE}`
    )
    products = result.items as { slug: string; updatedAt?: Date }[]
  }
  const now = new Date()

  return [
    { url: BASE, lastModified: now, changeFrequency: 'daily', priority: 1 },

    ...STATIC_PAGES.map((p) => ({
      url: `${BASE}${p.path}`,
      lastModified: now,
      changeFrequency: p.freq,
      priority: p.priority,
    })),

    ...CATEGORIES.map((c) => ({
      url: `${BASE}/products?category=${c.slug}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),

    ...BRANDS.map((b) => ({
      url: `${BASE}/brands/${b.slug}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.75,
    })),

    ...SERVICE_DETAILS.map((s) => ({
      url: `${BASE}/services/${s.slug}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),

    ...ARTICLES.map((a) => ({
      url: `${BASE}/blog/${a.slug}`,
      lastModified: new Date(a.publishedAt),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),

    ...products.map((p) => ({
      url: `${BASE}/products/${p.slug}`,
      lastModified: p.updatedAt ?? now,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
  ]
}
