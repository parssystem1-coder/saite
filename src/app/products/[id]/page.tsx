import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ProductDetailClient } from '@/components/products/product-detail-client'
import {
  getConsumablesForDevice,
  getProductById,
  getProductBySlug,
  getRelatedProducts,
} from '@/lib/api'
import { CATEGORIES } from '@/lib/constants'
import { getRatingSummary } from '@/types/product'

type Props = { params: Promise<{ id: string }> }

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

/** پارامتر مسیر می‌تواند slug (ترجیحی) یا id قدیمی باشد */
async function resolveProduct(idOrSlug: string) {
  return (await getProductBySlug(idOrSlug)) ?? (await getProductById(idOrSlug))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const product = await resolveProduct(id)

  if (!product) return { title: 'محصول یافت نشد' }

  return {
    title: product.name,
    description: product.shortDescription.slice(0, 160),
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: {
      title: product.name,
      description: product.shortDescription,
      images: product.images.map((url) => ({ url, alt: product.name })),
      type: 'website',
      locale: 'fa_IR',
    },
  }
}

export default async function ProductDetailPage({ params }: Props) {
  const { id } = await params
  const product = await resolveProduct(id)

  if (!product) notFound()

  const [related, consumables] = await Promise.all([
    getRelatedProducts(product),
    getConsumablesForDevice(product),
  ])

  const rating = getRatingSummary(product)
  const category = CATEGORIES.find((c) => c.slug === product.category)

  // دادهٔ ساخت‌یافتهٔ محصول — قیمت، موجودی و امتیاز در نتایج جستجو
  const productLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    sku: product.sku,
    mpn: product.model,
    brand: { '@type': 'Brand', name: product.brand },
    category: category?.name,
    description: product.shortDescription,
    image: product.images.map((i) => `${BASE}${i}`),
    ...(rating
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: rating.average,
            reviewCount: rating.count,
            bestRating: 5,
            worstRating: 1,
          },
          review: (product.reviews ?? []).map((r) => ({
            '@type': 'Review',
            author: { '@type': 'Person', name: r.author },
            datePublished: r.createdAt,
            reviewBody: r.body,
            reviewRating: { '@type': 'Rating', ratingValue: r.rating, bestRating: 5 },
          })),
        }
      : {}),
    ...(product.priceType === 'fixed' && product.price !== undefined
      ? {
          offers: {
            '@type': 'Offer',
            url: `${BASE}/products/${product.slug}`,
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
          },
        }
      : {}),
  }

  // مسیر راهنما برای نمایش سلسله‌مراتب در نتایج گوگل
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'خانه', item: BASE },
      {
        '@type': 'ListItem',
        position: 2,
        name: category?.name ?? 'محصولات',
        item: `${BASE}/products?category=${product.category}`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: product.name,
        item: `${BASE}/products/${product.slug}`,
      },
    ],
  }

  const faqLd =
    product.faqs && product.faqs.length > 0
      ? {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: product.faqs.map((f) => ({
            '@type': 'Question',
            name: f.question,
            acceptedAnswer: { '@type': 'Answer', text: f.answer },
          })),
        }
      : null

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      {faqLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
        />
      )}
      <ProductDetailClient product={product} related={related} consumables={consumables} />
    </>
  )
}
