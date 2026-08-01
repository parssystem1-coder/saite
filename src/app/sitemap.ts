import type { MetadataRoute } from 'next'
import { getProducts } from '@/lib/api'
import { CATEGORIES } from '@/lib/constants'

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await getProducts()
  const now = new Date()

  return [
    { url: BASE, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${BASE}/products`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    ...CATEGORIES.map((c) => ({
      url: `${BASE}/products?category=${c.slug}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
    ...products.map((p) => ({
      url: `${BASE}/products/${p.slug}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
  ]
}
