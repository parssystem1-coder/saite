import { absoluteUrl } from '@/lib/seo/site-url'
import { BRANDS, CATEGORIES } from '@/lib/constants'
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

  if (product.priceType === 'fixed' && product.price !== undefined) {
    ld.offers = {
      '@type': 'Offer',
      url: absoluteUrl(`/products/${product.slug}`),
      priceCurrency: 'IRR',
      price: product.price,
      availability:
        product.stockStatus === 'out_of_stock'
          ? 'https://schema.org/OutOfStock'
          : 'https://schema.org/InStock',
      itemCondition:
        product.condition === 'refurbished'
          ? 'https://schema.org/RefurbishedCondition'
          : 'https://schema.org/NewCondition',
    }
  }

  return ld
}
