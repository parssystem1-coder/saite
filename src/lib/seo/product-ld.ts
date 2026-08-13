import { BRANDS, CATEGORIES } from '@/lib/constants'
import { buildProductOfferLd } from '@/lib/seo/product-offer'
import { absoluteUrl } from '@/lib/seo/site-url'
import { getRatingSummary, type Product } from '@/types/product'

/** Product (+ optional Offer, AggregateRating, Review) schema.org */
export function buildProductLd(product: Product): Record<string, unknown> {
  const rating = getRatingSummary(product)
  const category = CATEGORIES.find((c) => c.slug === product.category)
  const brandName =
    BRANDS.find((b) => b.slug === product.brand)?.displayName ?? product.brand

  const ld: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    sku: product.sku,
    mpn: product.model,
    brand: { '@type': 'Brand', name: brandName },
    category: category?.name,
    description: product.shortDescription,
    image: product.images.map((src) => absoluteUrl(src)),
  }

  if (rating) {
    ld.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: rating.average,
      reviewCount: rating.count,
      bestRating: 5,
      worstRating: 1,
    }
    ld.review = (product.reviews ?? []).map((r) => ({
      '@type': 'Review',
      author: { '@type': 'Person', name: r.author },
      datePublished: r.createdAt,
      reviewBody: r.body,
      reviewRating: {
        '@type': 'Rating',
        ratingValue: r.rating,
        bestRating: 5,
      },
    }))
  }

  if (product.priceType === 'fixed') {
    const offers = buildProductOfferLd({
      priceToman: product.price,
      stockStatus: product.stockStatus,
      condition: product.condition,
      url: absoluteUrl(`/products/${product.slug}`),
    })
    if (offers) ld.offers = offers
  }

  return ld
}
